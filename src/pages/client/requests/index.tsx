// ClientRequests.tsx
"use client";


import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { databases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RequestItem {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number;
  volume: number;
  weight: number;
  price_client: number;
  status: 'pending' | 'validated' | 'in_progress' | 'delivered' | 'canceled';
  created_at: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await databases.listDocuments(
          'transport_db',
          'transports_requests',
          [Query.orderDesc('created_at')]
        );
        setRequests(res.documents);
      } catch (err) {
        toast.error("Erreur lors du chargement des demandes");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mes demandes</h1>

        {loading ? (
          <p className="text-white">Chargement en cours...</p>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card
                key={request.$id}
                className="bg-white rounded-2xl border shadow-sm hover:shadow-lg transition"
              >
                <CardHeader className="bg-blue-900 text-white rounded-t-2xl">
                  <CardTitle className="text-lg">{request.pickup_location} → {request.dropoff_location}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <p><strong>Distance :</strong> {request.distance_km} km</p>
                  <p><strong>Poids :</strong> {request.weight} kg</p>
                  <p><strong>Volume :</strong> {request.volume.toFixed(3)} m³</p>
                  <p><strong>Prix :</strong> <span className="text-orange-500 font-bold">{request.price_client} €</span></p>
                  <p>
                    <strong>Statut :</strong>{" "}
                    <span className={
                      request.status === "pending" ? "text-yellow-500" :
                      request.status === "validated" ? "text-blue-500" :
                      request.status === "in_progress" ? "text-purple-500" :
                      request.status === "delivered" ? "text-green-600" :
                      request.status === "canceled" ? "text-red-500" : ""
                    }>
                      {request.status === "pending" && "⏳ En attente"}
                      {request.status === "validated" && "✅ Validée"}
                      {request.status === "in_progress" && "🚚 En cours"}
                      {request.status === "delivered" && "📦 Livrée"}
                      {request.status === "canceled" && "❌ Annulée"}
                    </span>
                    </p>



                  <Button
                    onClick={() => navigate(`/client/requests/${request.$id}`)}
                    className="mt-2 bg-orange-400 hover:bg-orange-500 text-white rounded-xl"
                  >
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}