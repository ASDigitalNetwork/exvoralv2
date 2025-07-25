"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { account, databases, storage } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import dayjs from "dayjs";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Send, Upload, Eye } from "lucide-react";

interface TrackingUpdate {
  $id?: string;
  transport_id: string;
  status: string;
  remarks: string;
  updated_at: string;
  updated_by: string;
  loading_photo?: string;
  delivery_photo?: string;
}

export default function PartnerTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<TrackingUpdate>({
    transport_id: id || "",
    status: "in_progress",
    remarks: "",
    updated_at: new Date().toISOString(),
    updated_by: "",
    loading_photo: "",
    delivery_photo: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState<File | null>(null);
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTracking = async () => {
      try {
        const user = await account.get();
        const res = await databases.listDocuments("transport_db", "tracking_updates", [
          Query.equal("transport_id", id),
          Query.orderDesc("updated_at"),
          Query.limit(1),
        ]);

        const existing = res.documents[0];
        setTracking({
          ...tracking,
          ...(existing || {}),
          updated_by: user.$id,
        });
      } catch (err) {
        console.error("Erreur de chargement du suivi:", err);
      }
    };

    fetchTracking();
  }, [id]);

  const uploadFile = async (file: File, label: "loading" | "delivery") => {
    const uniqueId = ID.unique();
    const uploaded = await storage.createFile("tracking_photos", uniqueId, file);
    const url = storage.getFilePreview("tracking_photos", uploaded.$id).href;
    if (label === "loading") setTracking((prev) => ({ ...prev, loading_photo: url }));
    if (label === "delivery") setTracking((prev) => ({ ...prev, delivery_photo: url }));
  };

  const saveTracking = async () => {
    setSaving(true);
    try {
      if (loadingFile) await uploadFile(loadingFile, "loading");
      if (deliveryFile) await uploadFile(deliveryFile, "delivery");

      const now = new Date().toISOString();

      if (tracking.$id) {
        await databases.updateDocument("transport_db", "tracking_updates", tracking.$id, {
          status: tracking.status,
          remarks: tracking.remarks,
          updated_at: now,
          loading_photo: tracking.loading_photo,
          delivery_photo: tracking.delivery_photo,
        });
      } else {
        await databases.createDocument("transport_db", "tracking_updates", ID.unique(), {
          ...tracking,
          updated_at: now,
        });
      }
      alert("Suivi mis à jour !");
    } catch (err) {
      console.error("Erreur de sauvegarde du suivi:", err);
      alert("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <MapPin className="h-5 w-5 text-orange-500" />
              Suivi du transport #{id?.slice(0, 8)}
            </CardTitle>
            <CardDescription>
              Mettez à jour le statut, ajoutez des remarques et chargez des photos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Statut actuel</Label>
              <select
                className="w-full p-2 rounded border"
                value={tracking.status}
                onChange={(e) => setTracking((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="in_progress">En transit</option>
                <option value="delivering">Livraison en cours</option>
                <option value="delivered">Livré</option>
              </select>
            </div>
            <div>
              <Label>Remarques</Label>
              <Textarea
                placeholder="Notes de livraison..."
                value={tracking.remarks}
                onChange={(e) => setTracking((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
            <div>
              <Label>Photo de chargement</Label>
              <Input type="file" accept="image/*" onChange={(e) => setLoadingFile(e.target.files?.[0] || null)} />
              {tracking.loading_photo && (
                <div className="mt-2">
                  <img src={tracking.loading_photo} alt="Chargement" className="w-48 rounded shadow" />
                </div>
              )}
            </div>
            <div>
              <Label>Photo de livraison</Label>
              <Input type="file" accept="image/*" onChange={(e) => setDeliveryFile(e.target.files?.[0] || null)} />
              {tracking.delivery_photo && (
                <div className="mt-2">
                  <img src={tracking.delivery_photo} alt="Livraison" className="w-48 rounded shadow" />
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Dernière mise à jour : {dayjs(tracking.updated_at).format("DD/MM/YYYY à HH:mm")}
            </div>
            <Button onClick={saveTracking} disabled={saving} className="bg-blue-800 text-white">
              <Send className="h-4 w-4 mr-2" />
              {saving ? "Enregistrement..." : "Enregistrer la mise à jour"}
            </Button>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => navigate("/partner-transports")}>Retour aux transports</Button>
        </div>
      </div>
    </Layout>
  );
}
