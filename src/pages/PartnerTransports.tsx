// PartnerTransports.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Package, Eye } from "lucide-react";
import { ID } from "appwrite";
import { Layout } from "@/components/Layout";
import { account, databases } from "@/lib/appwrite";

interface Offer {
  $id: string;
  partner_id: string;
  price: number;
  status: string;
}

interface TransportRequest {
  $id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  package_type: string;
  package_weight: number;
  distance_km: number;
  final_price?: number;
  created_at: string;
  offers: Offer[];
}

export default function PartnerTransports() {
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTransports();
  }, []);

  const fetchTransports = async () => {
    try {
      const user = await account.get();
      const partnerId = user.$id;

      const res = await databases.listDocuments(
        "transport_db",
        "transport_requests",
        []
      );

      const filtered = res.documents.filter((req: any) =>
        req.offers?.some((offer: any) => offer.partner_id === partnerId)
      );

      setTransports(filtered);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map = {
      pending: { label: "En attente", variant: "secondary" },
      accepted: { label: "Accepté", variant: "default" },
      in_progress: { label: "En cours", variant: "default" },
      delivered: { label: "Livré", variant: "default" },
      cancelled: { label: "Annulé", variant: "destructive" },
    };
    return map[status] ?? { label: status, variant: "secondary" };
  };

  const getOfferStatus = (status: string) => {
    const map = {
      pending: { label: "En attente", variant: "secondary" },
      accepted: { label: "Acceptée", variant: "default" },
      rejected: { label: "Refusée", variant: "destructive" },
    };
    return map[status] ?? { label: status, variant: "secondary" };
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-500" />
            <h1 className="text-2xl font-bold text-blue-900">Mes Transports</h1>
          </div>
          <Button onClick={() => navigate("/available-requests")}className="bg-orange-400 hover:bg-orange-500 text-white">Voir les demandes</Button>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : transports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun transport</h3>
              <p className="text-muted-foreground text-center">
                Vous n'avez pas encore de transports assignés.
              </p>
              <Button onClick={() => navigate("/available-requests")} className="mt-4 bg-orange-400 hover:bg-orange-500 text-white">
                Consulter les demandes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {transports.map((t) => {
              const offer = t.offers.find((o) => o.partner_id);
              return (
                <Card
                  key={t.$id}
                  className="hover:shadow-md transition-shadow bg-white"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                        <Truck className="h-4 w-4 text-orange-500" />
                        Transport #{t.$id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={getOfferStatus(offer?.status || "").variant}>
                          Offre: {getOfferStatus(offer?.status || "").label}
                        </Badge>
                        <Badge variant={getStatusBadge(t.status).variant}>
                          {getStatusBadge(t.status).label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Départ:</span>
                      <span className="text-right text-muted-foreground">{t.pickup_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Arrivée:</span>
                      <span className="text-right text-muted-foreground">{t.destination_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Poids:</span>
                      <span>{t.package_weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span>{t.distance_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mon offre:</span>
                      <span className="text-orange-500 font-bold">{offer?.price ?? "-"} €</span>
                    </div>
                    {t.final_price && (
                      <div className="flex justify-between">
                        <span>Prix final:</span>
                        <span className="text-green-600 font-bold">{t.final_price} €</span>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2 border-t mt-2">
                      <Button
                        size="sm"
                        className="bg-blue-900 hover:bg-blue-800 text-white"
                        onClick={() => navigate(`/partner-tracking/${t.$id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> Gérer le suivi
                      </Button>
                      <Button
                        size="sm"
                        className="bg-orange-400 hover:bg-orange-500 text-white"
                        onClick={() => navigate(`/transport/${t.$id}`)}
                      >
                        Détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
