'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Send, Package, FileText, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

type RequestDoc = {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string; 
  distance_km: number;
  package_type?: string;
  weight?: number;
  volume?: number;
  price_partner?: number; // ← offre (stockée sur le doc)
  $createdAt?: string;
  $updatedAt?: string;
};

type Activity = {
  id: string;
  description: string;
  created_at: string;
};

export default function PartnerDashboard() {
  const { t } = useTranslation();

  const [userId, setUserId] = useState<string>('');
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [myOffers, setMyOffers] = useState<RequestDoc[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // input contrôlé pour chaque demande (clé = $id)
  const [offerInputs, setOfferInputs] = useState<Record<string, string>>({});

  const formatEUR = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n),
    []
  );

  const estimatedRevenue = useMemo(
    () => myOffers.reduce((sum, r) => sum + (r.price_partner || 0), 0),
    [myOffers]
  );

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const u = await account.get();
      setUserId(u.$id);

      // Demandes disponibles : status = 'pending'
      const available = await databases.listDocuments('transport_db', 'transports_requests', [
        Query.equal('status', 'pending'),
        Query.orderDesc('$createdAt'),
      ]);

      const offered = await databases.listDocuments('transport_db', 'transports_requests', [
        Query.greaterThan('price_partner', 0),
        Query.orderDesc('$updatedAt'),
      ]);

      setRequests(available.documents as unknown as RequestDoc[]);
      setMyOffers(offered.documents as unknown as RequestDoc[]);
    } catch (error) {
      toast.error(t.toastLoadError);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitOffer = async (requestId: string) => {
    const val = offerInputs[requestId];
    if (!val) return;
    try {
      const price = parseFloat(val);
      if (Number.isNaN(price) || price <= 0) {
        toast.error(t.toastInvalidPrice);
        return;
      }

      await databases.updateDocument('transport_db', 'transports_requests', requestId, {
        price_partner: price,
      });

      toast.success(t.toastOfferSuccess);
      // rafraîchir
      await loadDashboardData();
      setOfferInputs((prev) => ({ ...prev, [requestId]: '' }));
    } catch (err) {
      toast.error(t.toastOfferError);
      console.error(err);
    }
  };

  const stats = [
    { title: t.statsOpenRequests, value: requests.length, icon: <Package className="h-5 w-5" />, color: 'text-exv-accent' },
    { title: t.statsMyOffers, value: myOffers.length, icon: <FileText className="h-5 w-5" />, color: 'text-exv-accent' },
    { title: t.statsEstimatedRevenue, value: formatEUR(estimatedRevenue), icon: <Euro className="h-5 w-5" />, color: 'text-exv-accent' },
  ];

  return (
    <div className="p-4 space-y-6">
      <Card className="shadow-md rounded-3xl border border-exv-border bg-exv-panel text-exv-text">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t.partnerDashboardTitle}</h1>
              <p className="text-exv-sub">{t.partnerWelcome}</p>
            </div>
            <Button variant="outline" onClick={loadDashboardData} className="border-exv-border text-exv-text hover:bg-exv-card">
              {t.refresh}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-exv-card shadow border border-exv-border text-exv-text">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-exv-sub">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-exv-panel text-exv-text border border-exv-border rounded-xl p-1">
              <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-exv-accent data-[state=active]:text-exv-primary">
                {t.tabsRequests}
              </TabsTrigger>
              <TabsTrigger value="offers" className="rounded-lg data-[state=active]:bg-exv-accent data-[state=active]:text-exv-primary">
                {t.tabsOffers}
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-exv-accent data-[state=active]:text-exv-primary">
                {t.tabsActivity}
              </TabsTrigger>
            </TabsList>

            {/* Demandes disponibles */}
            <TabsContent value="requests" className="space-y-4">
              {isLoading && <p className="text-exv-sub">{t.loading}</p>}

              {!isLoading && requests.length === 0 && (
                <p className="text-exv-sub text-center">{t.noRequests}</p>
              )}

              {requests.map((r) => (
                <Card key={r.$id} className="bg-exv-card border border-exv-border text-exv-text">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">
                          {r.pickup_location} <span className="text-exv-sub">→</span> {r.dropoff_location}
                        </h3>
                        <div className="text-sm text-exv-sub">
                          <p>{t.labelDistance} {r.distance_km} km</p>
                          {typeof r.weight === 'number' && <p>{t.labelWeight} {r.weight} kg</p>}
                          {typeof r.volume === 'number' && <p>{t.labelVolume} {r.volume} m³</p>}
                          {r.package_type && <p>{t.labelType} {r.package_type}</p>}
                        </div>
                      </div>

                      <div className="w-full sm:w-1/3 space-y-2">
                        {typeof r.price_partner === 'number' && r.price_partner > 0 ? (
                          <p className="text-green-500 font-medium">
                            {t.offerSent} {formatEUR(r.price_partner)}
                          </p>
                        ) : (
                          <>
                            <Label className="text-exv-text">{t.priceInputLabel}</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder={t.pricePlaceholder}
                              className="bg-white text-black"
                              value={offerInputs[r.$id] || ''}
                              onChange={(e) =>
                                setOfferInputs((prev) => ({ ...prev, [r.$id]: e.target.value }))
                              }
                            />
                            <Button
                              onClick={() => submitOffer(r.$id)}
                              className="w-full bg-exv-accent text-exv-primary hover:opacity-90"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              {t.submitOffer}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Mes offres (docs avec price_partner > 0) */}
            <TabsContent value="offers" className="space-y-4">
              {isLoading && <p className="text-exv-sub">{t.loading}</p>}

              {!isLoading && myOffers.length === 0 && (
                <p className="text-exv-sub text-center">{t.offersEmpty}</p>
              )}

              {myOffers.map((r) => (
                <Card key={r.$id} className="bg-exv-card border border-exv-border text-exv-text">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="font-semibold">
                        {r.pickup_location} <span className="text-exv-sub">→</span> {r.dropoff_location}
                      </h4>
                      <p className="text-exv-sub">
                        {t.labelDistance} {r.distance_km} km
                      </p>
                    </div>
                    <Badge className="border-exv-border">
                      {t.proposedPrice} {formatEUR(r.price_partner || 0)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Historique (placeholder – brancher plus tard si tu as une table) */}
            <TabsContent value="activity" className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-exv-sub text-center">{t.activityEmpty}</p>
              ) : (
                activities.map((activity) => (
                  <Card key={activity.id} className="bg-exv-card border border-exv-border text-exv-text">
                    <CardContent className="p-5">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-exv-sub">{new Date(activity.created_at).toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
