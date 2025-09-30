"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Package, Camera, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

// ✅ Appwrite
import { account, databases, storage } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

type RequestDoc = {
  $id: string;
  status: "validated" | "in_progress" | "delivered" | "pending" | "canceled" | "cancelled";
  pickup_location?: string;
  dropoff_location?: string;
  pickup_address?: string;
  destination_address?: string;
  package_type?: string;
  assigned_partner_id?: string;
  // autres champs éventuels: weight, distance_km, ...
};

type TrackingUpdate = {
  $id: string;
  transport_request_id: string;
  partner_id: string;
  status: string;
  location_name?: string;
  notes?: string;
  photos?: string[];
  created_at?: string;
};

const DB_ID = "transport_db";
const REQ_COLLECTION = "transports_requests";
const UPDATES_COLLECTION = "tracking_updates";
// ⚠️ Adapte le nom du bucket si différent chez toi
const PHOTOS_BUCKET = "tracking_photos";

export default function PartnerTracking() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [userId, setUserId] = useState<string>("");
  const [assigned, setAssigned] = useState<RequestDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  const [transport, setTransport] = useState<RequestDoc | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStatus, setNewStatus] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const formatDateTime = useMemo(
    () => (iso?: string) => (iso ? new Date(iso).toLocaleString() : ""),
    []
  );

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchTransportAndUpdates(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const init = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      setUserId(user.$id);

      // 🔎 Récupère UNIQUEMENT les transports assignés à ce partenaire
      // et dans des statuts utiles (validés/en cours/livrés)
      const res = await databases.listDocuments(DB_ID, REQ_COLLECTION, [
        Query.equal("assigned_partner_id", user.$id),
        Query.equal("status", ["validated", "in_progress", "delivered"]),
        Query.orderDesc("$createdAt"),
      ]);

      const docs = (res.documents as unknown as RequestDoc[]) || [];
      setAssigned(docs);

      // Sélectionne le premier par défaut
      if (docs.length > 0) {
        setSelectedId(docs[0].$id);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchTransportAndUpdates = async (id: string) => {
    try {
      setLoading(true);
      const doc = await databases.getDocument(DB_ID, REQ_COLLECTION, id);
      setTransport(doc as unknown as RequestDoc);

      const up = await databases.listDocuments(DB_ID, UPDATES_COLLECTION, [
        Query.equal("transport_request_id", id),
        Query.equal("partner_id", userId),
        Query.orderDesc("$createdAt"),
      ]);
      setUpdates(up.documents as unknown as TrackingUpdate[]);
    } catch (e) {
      console.error("load tracking error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const photo of photos) {
      const fileId = ID.unique();
      const created = await storage.createFile(PHOTOS_BUCKET, fileId, photo);
      const href = storage.getFilePreview(PHOTOS_BUCKET, created.$id).href;
      urls.push(href);
    }
    return urls;
  };

  const addTrackingUpdate = async () => {
    if (!newStatus || !transport) return;
    setSubmitting(true);
    try {
      const photoUrls = photos.length ? await uploadPhotos() : [];

      await databases.createDocument(DB_ID, UPDATES_COLLECTION, ID.unique(), {
        transport_request_id: transport.$id,
        partner_id: userId,
        status: newStatus,
        location_name: locationName || null,
        notes: notes || null,
        photos: photoUrls,
        created_at: new Date().toISOString(),
      });

      // reset
      setNewStatus("");
      setLocationName("");
      setNotes("");
      setPhotos([]);

      // refresh
      await fetchTransportAndUpdates(transport.$id);

      toast({ title: t.trkToastOkTitle, description: t.trkToastOkDesc });
    } catch (e) {
      console.error(e);
      toast({ title: t.trkToastErrTitle, description: t.trkToastErrDesc, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const titleLine = (r: RequestDoc) => {
    const from = r.pickup_location || r.pickup_address || "-";
    const to = r.dropoff_location || r.destination_address || "-";
    return `${t.trkTransport} #${r.$id.slice(0, 8)} — ${from} → ${to}`;
  };

  if (loading && !transport && assigned.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.trkTitle}</h1>
        </div>
        <Card className="animate-pulse border-exv-border bg-exv-panel">
          <CardContent className="p-6">
            <div className="h-4 bg-exv-dark/40 rounded w-3/4 mb-2" />
            <div className="h-3 bg-exv-dark/30 rounded w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (assigned.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-2 text-exv-text">{t.trkNoAssignedTitle}</h1>
        <p className="text-exv-sub">{t.trkNoAssignedDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Select des transports assignés */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.trkTitle}</h1>
        </div>

        <div className="w-full md:w-[520px]">
          <label className="text-sm font-medium text-exv-text mb-1 block">{t.trkSelectLabel}</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="bg-exv-card border-exv-border text-exv-text">
              <SelectValue placeholder={t.trkSelectPlaceholder} />
            </SelectTrigger>
            <SelectContent className="bg-exv-panel text-exv-text border-exv-border">
              {assigned.map((r) => (
                <SelectItem key={r.$id} value={r.$id} className="focus:bg-exv-card">
                  {titleLine(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info transport */}
      {transport && (
        <Card className="border-exv-border bg-exv-card text-exv-text">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4 text-exv-accent" />
              {t.trkTransport} #{transport.$id.slice(0, 8)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.departure}</p>
                    <p className="text-sm text-exv-sub">
                      {transport.pickup_location || transport.pickup_address || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t.arrival}</p>
                    <p className="text-sm text-exv-sub">
                      {transport.dropoff_location || transport.destination_address || "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-exv-sub">{t.typeShort}</span>
                  <span className="text-sm font-medium">
                    {transport.package_type || t.notSpecified}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-exv-sub">{t.statusShort}</span>
                  <Badge variant="outline" className="border-exv-border">
                    {transport.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ajout d’une mise à jour */}
      <Card className="border-exv-border bg-exv-panel text-exv-text">
        <CardHeader>
          <CardTitle>{t.addUpdateTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.statusLabel}</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="bg-exv-card border-exv-border text-exv-text">
                  <SelectValue placeholder={t.statusPlaceholder} />
                </SelectTrigger>
                <SelectContent className="bg-exv-panel text-exv-text border-exv-border">
                  <SelectItem value="pickup" className="focus:bg-exv-card">
                    {t.statusPickup}
                  </SelectItem>
                  <SelectItem value="in_transit" className="focus:bg-exv-card">
                    {t.statusTransit}
                  </SelectItem>
                  <SelectItem value="delivered" className="focus:bg-exv-card">
                    {t.statusDelivered}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t.locationLabel}</label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t.locationPlaceholder}
                className="bg-white text-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.notesLabel}</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              rows={3}
              className="bg-white text-black"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.photosLabel}</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="flex items-center gap-2 border-exv-border text-exv-text hover:bg-exv-card"
              >
                <Camera className="h-4 w-4" />
                {t.addPhotos}
              </Button>
              <span className="text-sm text-exv-sub">
                {photos.length}/5 {t.photosCount}
              </span>
            </div>

            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="w-16 h-16 bg-exv-card border border-exv-border rounded flex items-center justify-center">
                      <Camera className="h-4 w-4 text-exv-sub" />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={addTrackingUpdate}
            disabled={submitting || !newStatus || !transport}
            className="w-full bg-exv-accent text-exv-primary hover:opacity-90"
          >
            {submitting ? t.sending : t.sendUpdate}
          </Button>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card className="border-exv-border bg-exv-card text-exv-text">
        <CardHeader>
          <CardTitle>{t.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-exv-sub text-center py-8">{t.historyEmpty}</p>
          ) : (
            <div className="space-y-4">
              {updates.map((up) => (
                <div key={up.$id} className="border-l-2 border-exv-accent pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="border-exv-border">
                      {up.status}
                    </Badge>
                    <span className="text-sm text-exv-sub">{formatDateTime(up.created_at)}</span>
                  </div>
                  {up.location_name && (
                    <p className="text-sm text-exv-sub mb-1">📍 {up.location_name}</p>
                  )}
                  {up.notes && <p className="text-sm mb-2">{up.notes}</p>}
                  {up.photos && up.photos.length > 0 && (
                    <div className="flex gap-2">
                      {up.photos.map((_, idx) => (
                        <div
                          key={idx}
                          className="w-16 h-16 bg-exv-panel border border-exv-border rounded flex items-center justify-center"
                        >
                          <Camera className="h-4 w-4 text-exv-sub" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
