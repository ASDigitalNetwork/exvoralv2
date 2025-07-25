import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, MapPin, Package, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Layout } from "@/components/Layout";
import { ID } from "@/lib/appwrite";


export default function AvailableRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState("");

  

  useEffect(() => {
    (async () => {
      const user = await account.get();
      setUserId(user.$id);
      const res = await databases.listDocuments("transport_db", "transports_requests", [
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt"),
      ]);
      setRequests(res.documents);
    })();
  }, []);


  const submitOffer = async () => {
  if (!selectedRequest || !offerPrice) return;
  setSubmitting(true);

  try {
    const price = parseFloat(offerPrice);

    // ✅ Mettre à jour price_partner dans la demande
    await databases.updateDocument("transport_db", "transports_requests", selectedRequest.$id, {
      price_partner: price,
    });

    toast({ title: "Offre envoyée", description: "Votre offre a bien été transmise." });

    // ✅ Rafraîchir les données
    const res = await databases.listDocuments("transport_db", "transports_requests", [
      Query.equal("status", "pending"),
      Query.orderDesc("$createdAt"),
    ]);
    setRequests(res.documents);

    setSelectedRequest(null);
    setOfferPrice("");
    setOfferMessage("");
  } catch (err) {
    console.error(err);
    toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
  } finally {
    setSubmitting(false);
  }
};



  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Eye className="text-blue-800" />
          <h1 className="text-2xl font-bold text-blue-800">Demandes Disponibles</h1>
          <Badge className="bg-orange-400 text-white">
            {requests.length} disponible{requests.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-10 w-10 mb-4 text-blue-800" />
              <h2 className="text-xl font-medium">Aucune demande disponible</h2>
              <p>Revenez plus tard pour voir de nouvelles demandes.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((r) => (
              <Card key={r.$id} className="hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Package className="h-4 w-4 text-orange-400" />
                    Demande #{r.$id.slice(0, 8)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-black">Départ :</p>
                      <p className="text-muted-foreground">{r.pickup_location}</p>
                      <p className="mt-2 font-semibold text-black">Arrivée :</p>
                      <p className="text-muted-foreground">{r.dropoff_location}</p>
                    </div>
                    <div>
                      <p className="text-black">Poids : <span className="font-medium">{r.weight} kg</span></p>
                      <p className="text-black">Volume : <span className="font-medium">{r.volume} m³</span></p>
                      <p className="text-black">Distance : <span className="font-medium">{r.distance_km} km</span></p>
                      <p className="text-black">Type : <span className="font-medium">{r.package_type || "Non spécifié"}</span></p>
                    </div>
                  </div>

                  {r.description && (
                    <div>
                      <p className="font-semibold text-black">Description :</p>
                      <p className="text-muted-foreground">{r.description}</p>
                    </div>
                  )}

                     {r.price_partner ? (
                      <p className="text-green-600 font-medium">Offre envoyée : {r.price_partner} €</p>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="bg-orange-400 hover:bg-orange-500" onClick={() => setSelectedRequest(r)}>
                            Faire une offre
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Faire une offre</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Prix proposé (€)</label>
                              <Input
                                type="number"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(e.target.value)}
                                placeholder="Votre prix"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Message (optionnel)</label>
                              <Textarea
                                value={offerMessage}
                                onChange={(e) => setOfferMessage(e.target.value)}
                                rows={3}
                                placeholder="Conditions, délais, remarques..."
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setSelectedRequest(null)}>Annuler</Button>
                              <Button
                                onClick={submitOffer}
                                disabled={submitting || !offerPrice}
                                className="bg-blue-800 text-white hover:bg-blue-900"
                              >
                                {submitting ? "Envoi..." : "Envoyer l’offre"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
