'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Send, Package, FileText, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface Request {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  distance_km: number;
  package_type: string;
  package_weight: number;
  created_at: string;
}

interface Activity {
  id: string;
  description: string;
  created_at: string;
}

export default function PartnerDashboard() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: allRequests } = await supabase
        .from('transport_requests')
        .select('*')
        .in('status', ['pending', 'approved', 'inProgress'])
        .order('created_at', { ascending: false });

      const { data: myOffers } = await supabase
        .from('offers')
        .select('*')
        .eq('partner_id', user.id);

      const { data: activityLog } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setRequests(allRequests || []);
      setOffers(myOffers || []);
      setActivities(activityLog || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const submitOffer = async (requestId: string, price: number) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase.from('offers').insert({
        transport_request_id: requestId,
        partner_id: user.id,
        price,
        status: 'pending'
      });

      if (error) throw error;
      toast.success('Offre envoyée avec succès');
      loadDashboardData();
    } catch (err) {
      toast.error('Erreur lors de la soumission');
    }
  };

  const stats = [
    { title: 'Demandes en cours', value: requests.length, icon: <Package className="h-5 w-5" />, color: 'text-blue-800' },
    { title: 'Mes offres', value: offers.length, icon: <FileText className="h-5 w-5" />, color: 'text-orange-500' },
    { title: 'Revenus estimés', value: '0€', icon: <Euro className="h-5 w-5" />, color: 'text-green-600' },
  ];

  return (
    <div className="p-4 space-y-6 bg-gray-100 min-h-screen">
      <Card className="shadow-md rounded-3xl">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Tableau de bord Partenaire</h1>
              <p className="text-blue-800">{t.welcomeMessage || "Suivez vos activités et proposez vos prix"}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white shadow border">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-orange-400 text-black">
              <TabsTrigger value="requests">Demandes</TabsTrigger>
              <TabsTrigger value="offers">Mes offres</TabsTrigger>
              <TabsTrigger value="tracking">Suivi</TabsTrigger>
              <TabsTrigger value="activity">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              {requests.length === 0 && <p className="text-black text-center">Aucune demande disponible.</p>}
              {requests.map((req) => (
                <Card key={req.id} className="bg-white border">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{req.pickup_address} → {req.destination_address}</h3>
                        <div className="text-sm text-gray-500">
                          <p>Distance : {req.distance_km} km</p>
                          <p>Poids : {req.package_weight} kg</p>
                          <p>Type : {req.package_type}</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-1/3 space-y-2">
                        <Label>Votre prix (€)</Label>
                        <Input id={`offer-${req.id}`} type="number" placeholder="ex: 350" />
                        <Button
                          onClick={() => {
                            const val = (document.getElementById(`offer-${req.id}`) as HTMLInputElement)?.value;
                            if (val) submitOffer(req.id, parseFloat(val));
                          }}
                          className="w-full"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Proposer ce prix
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="offers" className="space-y-4">
              {offers.length === 0 && <p className="text-black text-center">Vous n'avez pas encore soumis d'offre.</p>}
              {offers.map((offer) => (
                <Card key={offer.id} className="bg-white">
                  <CardContent className="p-5 flex justify-between">
                    <div>
                      <h4 className="font-semibold">Offre #{offer.id.substring(0, 6)}</h4>
                      <p className="text-gray-500">Prix proposé : {offer.price}€</p>
                    </div>
                    <Badge>{offer.status === 'accepted' ? 'Acceptée' : 'En attente'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tracking" className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={loadDashboardData}>
                  Rafraîchir
                </Button>
              </div>

              {requests.length === 0 ? (
                <p className="text-center text-black font-medium">
                  Aucun suivi de livraison disponible pour le moment.
                </p>
              ) : (
                requests.map((req) => (
                  <Card key={req.id} className="bg-white">
                    <CardHeader>
                      <CardTitle className="flex gap-2 items-center">
                        <MapPin className="h-5 w-5" /> {req.pickup_address} → {req.destination_address}
                      </CardTitle>
                      <CardDescription>Met à jour le statut ou ajoute des remarques</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Statut actuel</Label>
                          <select className="w-full p-2 rounded border">
                            <option value="inProgress">En transit</option>
                            <option value="delivering">Livraison en cours</option>
                            <option value="delivered">Livré</option>
                          </select>
                        </div>
                        <div>
                          <Label>Remarques</Label>
                          <Textarea placeholder="Notes de livraison..." />
                        </div>
                        <Button>
                          <Send className="h-4 w-4 mr-2" />
                          Enregistrer la mise à jour
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-black text-center">Aucune activité récente.</p>
              ) : (
                activities.map((activity) => (
                  <Card key={activity.id} className="bg-white">
                    <CardContent className="p-5">
                      <p className="text-sm text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.created_at).toLocaleString()}</p>
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
