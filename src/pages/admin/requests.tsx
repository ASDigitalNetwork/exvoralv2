import { useEffect, useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface TransportRequest {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  distance_km: number;
  weight: number;
  volume: number;
  price_client: number;
  price_partner?: number;
  file_id?: string;
  pickup_date: string;
  delivery_date: string;
  client_name: string;
  created_at: string;
}

interface PartnerOffer {
  $id: string;
  partner_id: string;
  transport_request_id: string;
  price: number;
  message?: string;
  partner_company_name?: string;
  partner_short_id?: number;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await databases.listDocuments("transport_db", "transports_requests", [
        Query.orderDesc("created_at")
      ]);
      setRequests(res.documents as TransportRequest[]);

      const offersRes = await databases.listDocuments("transport_db", "partner_offers", []);
      setOffers(offersRes.documents as PartnerOffer[]);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive"
      });
    }
  };

  const validateOffer = async (offer: PartnerOffer, request: TransportRequest) => {
    try {
      const admin = await account.get();

      await databases.createDocument("transport_db", "transport_assignments", ID.unique(), {
        transport_request_id: request.$id,
        partner_id: offer.partner_id,
        admin_id: admin.$id,
        accepted_price: offer.price,
        partner_short_id: offer.partner_short_id,
        partner_company_name: offer.partner_company_name,
        created_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
        status: "assigned"
      });

      await databases.updateDocument("transport_db", "transports_requests", request.$id, {
        status: "validated",
        price_partner: offer.price
      });

      const otherOffers = offers.filter(
        (o) => o.transport_request_id === request.$id && o.$id !== offer.$id
      );
      for (const o of otherOffers) {
        await databases.updateDocument("transport_db", "partner_offers", o.$id, {
          status: "refused"
        });
      }

      toast({
        title: "Validé",
        description: "L'offre a été validée avec succès."
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Échec lors de la validation.",
        variant: "destructive"
      });
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await databases.updateDocument("transport_db", "transports_requests", id, {
        status: "canceled"
      });
      toast({
        title: "Refusée",
        description: "La demande a été refusée."
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la demande.",
        variant: "destructive"
      });
    }
  };

  const filtered = requests.filter(
    (r) =>
      r.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
      r.dropoff_location.toLowerCase().includes(search.toLowerCase()) ||
      r.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-800">Demandes de Transport</h1>
          <Input
            placeholder="Rechercher (client, ville...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {filtered.map((req) => {
          const relatedOffers = offers.filter((o) => o.transport_request_id === req.$id);
          return (
            <Card key={req.$id}>
              <CardHeader>
                <CardTitle>
                  Demande #{req.$id.slice(0, 8)} - {req.client_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  <strong>Départ:</strong> {req.pickup_location}
                </p>
                <p>
                  <strong>Arrivée:</strong> {req.dropoff_location}
                </p>
                <p>
                  <strong>Prix estimé:</strong> {req.price_client} €
                </p>
                <p>
                  <strong>Dates:</strong>{" "}
                  {new Date(req.pickup_date).toLocaleDateString()} →{" "}
                  {new Date(req.delivery_date).toLocaleDateString()}
                </p>
                {req.file_id && (
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/request_files/files/${req.file_id}/preview?project=68769734001f7d9ae3bc`}
                    alt="Photo"
                    className="w-48 rounded"
                  />
                )}
                <div className="space-y-2">
                  {relatedOffers.length === 0 ? (
                    <p className="text-muted-foreground italic">Aucune offre pour cette demande.</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedOffers.map((offer) => {
                        const isValidated =
                          req.status === "validated" && req.price_partner === offer.price;

                        return (
                          <div
                            key={offer.$id}
                            className="border p-2 rounded flex justify-between items-center"
                          >
                            <div>
                              <p>
                                <strong>Offre de:</strong>{" "}
                                {offer.partner_company_name || "Partenaire inconnu"}
                              </p>
                              <p>
                                <strong>Prix proposé:</strong> {offer.price} €
                              </p>
                              {offer.message && (
                                <p className="text-sm text-muted-foreground">{offer.message}</p>
                              )}
                              {isValidated && (
                                <p className="text-green-600 font-semibold">✅ Offre validée</p>
                              )}
                            </div>
                            {!isValidated && (
                              <Button size="sm" onClick={() => validateOffer(offer, req)}>
                                Valider
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {req.status !== "validated" && (
                    <Button variant="destructive" onClick={() => cancelRequest(req.$id)}>
                      Refuser la demande
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
