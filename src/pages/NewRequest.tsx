// NewRequest.tsx
"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Upload,
  Calculator,
  ArrowLeft,
  Package,
  CalendarDays,
  ImagePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';
import { account, databases, storage } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { useTranslation } from '@/hooks/useTranslation';

const schema = z.object({
  pickupAddress: z.string().min(1),
  destinationAddress: z.string().min(1),
  description: z.string().optional(),
  packageType: z.string().min(1),
  packageHeight: z.coerce.number().min(0.1),
  packageWidth: z.coerce.number().min(0.1),
  packageDepth: z.coerce.number().min(0.1),
  packageWeight: z.coerce.number().min(0.1),
  pickupDate: z.date(),
  deliveryDate: z.date(),
  file: z.any().optional()
});

type FormData = z.infer<typeof schema>;

export default function NewRequest() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await account.get();
        setUserId(session.$id);
      } catch (err) {
        toast.error("Utilisateur non connecté");
        navigate("/auth");
      }
    };
    fetchUser();
  }, [navigate]);

  const calculatePrice = (distance: number, volume: number, weight: number): number => {
    const basePrice = 50;
    const distancePrice = distance * 1.2;
    const volumePrice = volume * 100;
    const weightPrice = weight * 2;
    return Math.round((basePrice + distancePrice + Math.max(volumePrice, weightPrice)) * 100) / 100;
  };

  const calculateRoute = async (pickup: string, destination: string) => {
    setIsCalculating(true);
    try {
      const geo = async (addr: string) => {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
        const data = await res.json();
        return [parseFloat(data[0].lon), parseFloat(data[0].lat)];
      };

      const [start, end] = await Promise.all([geo(pickup), geo(destination)]);
      const routeRes = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=simplified&geometries=geojson`
      );
      const route = await routeRes.json();
      const km = Math.round(route.routes[0].distance / 1000);
      const vol = (form.getValues('packageHeight') / 100) * (form.getValues('packageWidth') / 100) * (form.getValues('packageDepth') / 100);
      const price = calculatePrice(km, vol, form.getValues('packageWeight'));
      setRouteData({ km, vol, price, start, end });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du calcul de l'itinéraire");
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!routeData || !userId) return;
    try {
      setIsLoading(true);
      let fileId = null;
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
      toast.success("🎉 Votre demande a bien été créée ! Vous pouvez la suivre dans l'onglet Mes transports.");
      navigate('/client/requests');
    } catch (e: any) {
      console.error("Erreur lors de la création:", e);
      toast.error(e.message || "Erreur lors de la création de la demande");
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
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse de prise en charge</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="destinationAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse de destination</FormLabel>
                  <FormControl>
                    <Input placeholder="Adresse complète" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="packageType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de colis</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: palette, boîte, caisse..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField control={form.control} name="packageHeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hauteur (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="packageWidth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largeur (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="packageDepth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profondeur (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="packageWeight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="pickupDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de prise en charge</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de livraison</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormItem>
                <FormLabel>Joindre une image (optionnel)</FormLabel>
                <FormControl>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </FormControl>
              </FormItem>

              <Button
                  type="button"
                  disabled={isCalculating}
                  onClick={() => calculateRoute(form.getValues('pickupAddress'), form.getValues('destinationAddress'))}
                  className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl shadow"
                >
                  {isCalculating ? 'Calcul en cours...' : 'Calculer la distance et le prix'}
                </Button>

                <Button
                  type="submit"
                  disabled={!routeData || isLoading}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-xl shadow"
                >
                  {isLoading ? 'Création...' : 'Créer la demande'}
              </Button>

            </form>
          </Form>
        </div>

        <div className="space-y-6">
          {routeData && (
            <Card className="border border-blue-200 shadow-md rounded-xl">
              <CardHeader className="bg-blue-900 text-white rounded-t-xl">
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-blue-900 font-medium">
                <p><strong>Distance</strong>: {routeData.km} km</p>
                <p><strong>Volume</strong>: {routeData.vol.toFixed(3)} m³</p>
                <p><strong>Prix estimé</strong>: <span className="text-orange-500 font-bold">{routeData.price} €</span></p>
              </CardContent>
            </Card>

          )}

          {routeData?.start && routeData?.end && (
            <div className="relative w-full h-64 rounded-xl overflow-hidden border border-blue-200 shadow">
              <img
                className="absolute inset-0 object-cover w-full h-full"
                src={`https://static-maps.yandex.ru/1.x/?lang=fr_FR&l=map&pt=${routeData.start[0]},${routeData.start[1]},pm2blm~${routeData.end[0]},${routeData.end[1]},pm2grm&z=${getZoomLevel(routeData.km)}&size=650,450`}
                alt="Carte des points"
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}