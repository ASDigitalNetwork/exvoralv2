// src/pages/NewRequest.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';
import { account, databases, storage } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewRequest() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Schéma avec messages i18n
  const schema = useMemo(() => z.object({
    pickupAddress: z.string().min(1, t.errPickupRequired),
    destinationAddress: z.string().min(1, t.errDestinationRequired),
    description: z.string().optional(),
    packageType: z.string().min(1, t.errPackageTypeRequired),
    packageHeight: z.coerce.number().min(0.1, t.errHeightMin),
    packageWidth: z.coerce.number().min(0.1, t.errWidthMin),
    packageDepth: z.coerce.number().min(0.1, t.errDepthMin),
    packageWeight: z.coerce.number().min(0.1, t.errWeightMin),
    pickupDate: z.date(),
    deliveryDate: z.date(),
    file: z.any().optional()
  }), [t]);

  type FormData = z.infer<typeof schema>;

  const [userId, setUserId] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<{
    km: number;
    vol: number;
    price: number;
    start?: [number, number];
    end?: [number, number];
    lane?: string;      // "PT→PT", "PT→FR", "PT→CH", "GENERIC"
    note?: string;      // petite note d’avertissement
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      pickupAddress: '',
      destinationAddress: '',
      description: '',
      packageType: '',
      packageHeight: 0,
      packageWidth: 0,
      packageDepth: 0,
      packageWeight: 0,
      pickupDate: new Date(),
      deliveryDate: new Date(),
    },
  });

  const formatEUR = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 2,
      }).format(n),
    []
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await account.get();
        setUserId(session.$id);
      } catch {
        toast.error(t.toastUserNotConnected);
        navigate("/auth");
      }
    };
    fetchUser();
  }, [navigate, t]);

  /**
   * ---------- TARIFS ----------
   * D’après la grille fournie (PT national par distance/poids ; International PT→FR/CH par poids).
   */
  const getWeightBandIndex = (kg: number) => {
    if (kg <= 150) return 0;
    if (kg <= 300) return 1;
    if (kg <= 600) return 2;
    if (kg <= 1000) return 3;
    return 3; // on plafonne à la tranche max et on indique "approx"
  };

  // Portugal → Portugal (distance vs poids)
  const tariffPTPT = (distanceKm: number, weightKg: number) => {
    const w = getWeightBandIndex(weightKg);
    let row: number[] = [];
    if (distanceKm <= 50)      row = [45, 60, 80, 100];
    else if (distanceKm <= 150)row = [60, 80, 110, 140];
    else if (distanceKm <= 300)row = [80, 100, 130, 160];
    else if (distanceKm <= 600)row = [120, 150, 180, 220];
    else                       row = [160, 190, 230, 280];
    const base = row[w];
    return { price: base, approx: weightKg > 1000 };
  };

  // Portugal → France (par poids)
  const tariffPTFR = (weightKg: number) => {
    const rows = [180, 220, 280, 340];
    const w = getWeightBandIndex(weightKg);
    return { price: rows[w], approx: weightKg > 1000 };
  };

  // Portugal → Suisse (par poids)
  const tariffPTCH = (weightKg: number) => {
    const rows = [250, 300, 380, 450];
    const w = getWeightBandIndex(weightKg);
    return { price: rows[w], approx: weightKg > 1000 };
  };

  // Ancien fallback générique (si itinéraire hors cas pris en charge)
  const genericFormula = (distance: number, volume: number, weight: number): number => {
    const basePrice = 50;
    const distancePrice = distance * 1.2;
    const volumePrice = volume * 100;
    const weightPrice = weight * 2;
    return Math.round((basePrice + distancePrice + Math.max(volumePrice, weightPrice)) * 100) / 100;
  };

  // Détermine prix + type de corridor utilisé
  const computeTariffPrice = (km: number, vol: number, kg: number, from: string, to: string) => {
    const ccFrom = (from || '').toLowerCase();
    const ccTo = (to || '').toLowerCase();

    // PT → PT
    if (ccFrom === 'pt' && ccTo === 'pt') {
      const { price, approx } = tariffPTPT(km, kg);
      return {
        price,
        lane: 'PT→PT',
        note: approx ? t.noteHeavyApprox : undefined,
      };
    }

    // PT → FR
    if (ccFrom === 'pt' && ccTo === 'fr') {
      const { price, approx } = tariffPTFR(kg);
      return {
        price,
        lane: 'PT→FR',
        note: approx ? t.noteHeavyApprox : t.noteIntlFR,
      };
    }

    // PT → CH
    if (ccFrom === 'pt' && ccTo === 'ch') {
      const { price, approx } = tariffPTCH(kg);
      return {
        price,
        lane: 'PT→CH',
        note: approx ? t.noteHeavyApprox : t.noteIntlCH,
      };
    }

    // Fallback générique
    const fallback = genericFormula(km, vol, kg);
    return {
      price: fallback,
      lane: 'GENERIC',
      note: t.noteGenericLane,
    };
  };

  /**
   * ---------- DISTANCE ----------
   * On conserve ta logique (OSRM). On ajoute addressdetails=1 pour récupérer les pays.
   */
  const calculateRoute = async (pickup: string, destination: string) => {
    setIsCalculating(true);
    try {
      const geo = async (addr: string) => {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            addr
          )}&limit=1`,
          { headers: { 'Accept-Language': 'fr' } }
        );
        const data = await res.json();
        if (!data?.[0]) throw new Error('Geocoding failed');
        const lon = parseFloat(data[0].lon);
        const lat = parseFloat(data[0].lat);
        const cc = data[0]?.address?.country_code as string | undefined;
        return { coord: [lon, lat] as [number, number], country_code: cc || '' };
      };

      const [startObj, endObj] = await Promise.all([geo(pickup), geo(destination)]);

      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${startObj.coord[0]},${startObj.coord[1]};${endObj.coord[0]},${endObj.coord[1]}?overview=simplified&geometries=geojson`
      );
      const route = await routeRes.json();
      const km = Math.round(route.routes[0].distance / 1000);

      // volume m³ (cm -> m)
      const vol =
        (form.getValues('packageHeight') / 100) *
        (form.getValues('packageWidth') / 100) *
        (form.getValues('packageDepth') / 100);

      const weight = form.getValues('packageWeight');

      const { price, lane, note } = computeTariffPrice(
        km,
        vol,
        weight,
        startObj.country_code,
        endObj.country_code
      );

      setRouteData({
        km,
        vol,
        price: Math.round(price * 100) / 100,
        start: startObj.coord,
        end: endObj.coord,
        lane,
        note,
      });
    } catch (e) {
      console.error(e);
      toast.error(t.toastRouteError);
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!routeData || !userId) return;
    try {
      setIsLoading(true);
      let fileId: string | null = null;
      if (file) {
        const uploaded = await storage.createFile('request_files', ID.unique(), file);
        fileId = uploaded.$id;
      }

      await databases.createDocument('transport_db', 'transports_requests', ID.unique(), {
        client_id: userId,
        pickup_location: data.pickupAddress,
        dropoff_location: data.destinationAddress,
        weight: data.packageWeight,
        volume: routeData.vol,
        distance_km: routeData.km,
        price_client: routeData.price,
        pickup_date: data.pickupDate.toISOString(),
        delivery_date: data.deliveryDate.toISOString(),
        status: 'pending',
        created_at: new Date().toISOString(),
        file_id: fileId
      });
      toast.success(t.toastCreatedSuccess);
      navigate('/client/requests');
    } catch (e: any) {
      console.error("Erreur lors de la création:", e);
      toast.error(e?.message || t.toastCreateError);
    } finally {
      setIsLoading(false);
    }
  };

  const getZoomLevel = (distanceKm: number) => {
    if (distanceKm < 10) return 13;
    if (distanceKm < 50) return 10;
    if (distanceKm < 100) return 9;
    if (distanceKm < 200) return 8;
    if (distanceKm < 500) return 7;
    if (distanceKm < 1000) return 6;
    return 5;
  };

  return (
    <Layout showSidebar>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire (inchangé) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-exv-border bg-exv-panel text-exv-text">
            <CardHeader>
              <CardTitle className="text-exv-text">{t.newRequestTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Pickup */}
                  <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-exv-text">{t.pickupAddressLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.addressPlaceholder} {...field} className="bg-white text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Destination */}
                  <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-exv-text">{t.destinationAddressLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.addressPlaceholder} {...field} className="bg-white text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Type colis */}
                  <FormField control={form.control} name="packageType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-exv-text">{t.packageTypeLabel}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.packageTypePlaceholder} {...field} className="bg-white text-black" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Dimensions + poids */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="packageHeight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-exv-text">{t.heightCm}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white text-black" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="packageWidth" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-exv-text">{t.widthCm}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white text-black" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="packageDepth" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-exv-text">{t.depthCm}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white text-black" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="packageWeight" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-exv-text">{t.weightKg}</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-white text-black" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  {/* Dates */}
                  <FormField control={form.control} name="pickupDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">{t.pickupDateLabel}</FormLabel>
                      <FormControl className="text-black">
                        <DatePicker date={field.value} onDateChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-black">{t.deliveryDateLabel}</FormLabel>
                      <FormControl className="text-black">
                        <DatePicker date={field.value} onDateChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Fichier */}
                  <FormItem>
                    <FormLabel className="text-exv-text">{t.attachImageOptional}</FormLabel>
                    <FormControl>
                      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-white text-black" />
                    </FormControl>
                  </FormItem>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      type="button"
                      disabled={isCalculating}
                      onClick={() => calculateRoute(form.getValues('pickupAddress'), form.getValues('destinationAddress'))}
                      className="bg-exv-accent hover:opacity-90 text-exv-primary font-semibold px-4 py-2 rounded-xl shadow"
                    >
                      {isCalculating ? t.btnCalculating : t.btnCalcDistancePrice}
                    </Button>

                    <Button
                      type="submit"
                      disabled={!routeData || isLoading}
                      className="bg-exv-dark hover:opacity-90 text-exv-text font-semibold px-4 py-2 rounded-xl shadow"
                    >
                      {isLoading ? t.btnCreating : t.btnCreateRequest}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Panneau de droite (inchangé visuel) + notes */}
        <div className="space-y-6">
          {routeData && (
            <Card className="border border-exv-border shadow-md rounded-xl bg-exv-card text-exv-text">
              <CardHeader className="bg-exv-panel text-exv-text rounded-t-xl border-b border-exv-border">
                <CardTitle>{t.summaryTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-exv-text">
                <p><strong>{t.summaryDistance}</strong>: {routeData.km} km</p>
                <p><strong>{t.summaryVolume}</strong>: {routeData.vol.toFixed(3)} m³</p>
                <p><strong>{t.summaryEstimatedPrice}</strong>: <span className="text-exv-accent font-bold">{formatEUR(routeData.price)}</span></p>

                {/* Lignes d’info (prix indicatif / corridor) */}
                {routeData.lane && (
                  <p className="text-xs text-exv-sub">
                    <span className="font-medium">{t.tariffLane} </span>
                    {routeData.lane === 'PT→PT' && t.lanePTPT}
                    {routeData.lane === 'PT→FR' && t.lanePTFR}
                    {routeData.lane === 'PT→CH' && t.lanePTCH}
                    {routeData.lane === 'GENERIC' && t.laneGeneric}
                  </p>
                )}
                <p className="text-xs text-exv-sub">{t.approxNote}</p>
                {routeData.note && <p className="text-xs text-exv-sub">{routeData.note}</p>}
                {(routeData.lane === 'PT→FR' || routeData.lane === 'PT→CH') && (
                  <p className="text-xs text-exv-sub">{t.customsNote}</p>
                )}
              </CardContent>
            </Card>
          )}

          {routeData?.start && routeData?.end && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-exv-border shadow">
              <img
                className="absolute inset-0 object-cover w-full h-full"
                src={`https://static-maps.yandex.ru/1.x/?lang=fr_FR&l=map&pt=${routeData.start[0]},${routeData.start[1]},pm2blm~${routeData.end[0]},${routeData.end[1]},pm2grm&z=${getZoomLevel(routeData.km)}&size=650,450`}
                alt="Map"
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
