"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";

interface TransportRequest {
  $id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  created_at: string;
  client_id: string;
}

export default function MesTransportsPage() {
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("validated");
  const navigate = useNavigate();

  const fetchTransports = async () => {
    setIsLoading(true);
    try {
      const user = await account.get();
      const res = await databases.listDocuments("transport_db", "transport_requests", [
        Query.equal("status", filter),
        Query.equal("client_id", user.$id)
      ]);
      setTransports(res.documents);
    } catch (error) {
      console.error("Erreur de chargement des transports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, [filter]);

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">Mes transports</h1>
          <div className="flex gap-2 items-center">
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-blue-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="validated">✅ Validé</option>
              <option value="pending">🕒 En attente</option>
              <option value="in_transit">🚚 En cours</option>
              <option value="delivered">🏁 Terminé</option>
            </select>
            <Button onClick={fetchTransports} variant="outline" className="gap-2 border-blue-700 text-blue-700 hover:bg-blue-50">
              <RefreshCcw className="h-4 w-4" /> Rafraîchir
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-blue-800">Chargement de vos transports...</div>
        ) : transports.length === 0 ? (
          <p className="text-muted-foreground">Aucun transport trouvé pour le filtre sélectionné.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {transports.map((t) => (
              <Card key={t.$id} className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-orange-400" />
                    Transport #{t.$id.slice(0, 6)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="text-green-600 h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{t.pickup_address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="text-red-600 h-4 w-4" />
                    <span className="text-sm text-muted-foreground">{t.destination_address}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Badge className={
                      t.status === "delivered"
                        ? "bg-green-500"
                        : t.status === "in_transit"
                        ? "bg-yellow-500"
                        : t.status === "pending"
                        ? "bg-gray-400"
                        : "bg-blue-500"
                    }>
                      {t.status === "delivered"
                        ? "Terminé"
                        : t.status === "in_transit"
                        ? "En cours"
                        : t.status === "pending"
                        ? "En attente"
                        : "Validé"}
                    </Badge>
                    <Button
                      className="bg-orange-400 text-white hover:bg-orange-500"
                      onClick={() => navigate(`/transports/${t.$id}`)}
                    >
                      Suivre
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
