// src/pages/requests.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { Query, Permission, Role } from "appwrite";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Trash2 } from "lucide-react";

type ReqStatus = "pending" | "validated" | "in_progress" | "delivered" | "canceled";
type OfferStatus = "pending" | "accepted" | "rejected";

interface TransportRequest {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  status: ReqStatus;
  distance_km: number;
  weight: number;
  volume: number;
  price_client: number;
  final_price?: number | null;
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
  status?: OfferStatus;
  $createdAt?: string;
}

const DB_ID = "transport_db";
const COL_REQUESTS = "transports_requests";
const COL_OFFERS = "partner_offers";
const COL_ASSIGN = "transport_assignments";
const COL_PROFILES = "user_profiles";
const BUCKET_FILES = "request_files";

type ReqFilter = "all" | "pending" | "validated" | "canceled";

export default function AdminRequests() {
  const { t } = useTranslation();

  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReqFilter>("all");

  // Confirm générique
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

  // Dialog modifier l’offre
  const [editingOffer, setEditingOffer] = useState<PartnerOffer | null>(null);
  const [editOfferPrice, setEditOfferPrice] = useState("");
  const [editOfferMessage, setEditOfferMessage] = useState("");

  // Edition prix définitif (inline par demande)
  const [finalEdit, setFinalEdit] = useState<{ id: string | null; value: string }>({
    id: null,
    value: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [reqRes, offRes] = await Promise.all([
        databases.listDocuments(DB_ID, COL_REQUESTS, [Query.orderDesc("created_at")]),
        databases.listDocuments(DB_ID, COL_OFFERS, [Query.orderDesc("$createdAt")]),
      ]);
      setRequests(reqRes.documents as unknown as TransportRequest[]);
      setOffers(offRes.documents as unknown as PartnerOffer[]);
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.adminReqLoadErr ?? "Impossible de charger les demandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBySearch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.pickup_location.toLowerCase().includes(q) ||
        r.dropoff_location.toLowerCase().includes(q) ||
        r.client_name.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return filteredBySearch;
    return filteredBySearch.filter((r) => r.status === statusFilter);
  }, [filteredBySearch, statusFilter]);

  const relatedOffers = (requestId: string) =>
    offers.filter((o) => o.transport_request_id === requestId);

  const loadPartnerMeta = async (partnerId: string) => {
    try {
      const profRes = await databases.listDocuments(DB_ID, COL_PROFILES, [
        Query.equal("user_id", partnerId),
        Query.limit(1),
      ]);
      const p = (profRes.documents?.[0] as any) || {};
      const company =
        p.company || p.company_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—";
      const shortId = p.short_id ?? null;
      return { company, shortId };
    } catch {
      return { company: "—", shortId: null };
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ✅ Accepter une offre (assignment) — SANS assigned_partner_id
  const validateOffer = async (offer: PartnerOffer, request: TransportRequest) => {
    try {
      const admin = await account.get();
      const { company, shortId } = await loadPartnerMeta(offer.partner_id);

      const payload = {
        transport_request_id: request.$id,
        partner_id: offer.partner_id,
        admin_id: admin.$id,
        accepted_price: offer.price,
        partner_short_id: typeof offer.partner_short_id === "number" ? offer.partner_short_id : shortId,
        partner_company_name: offer.partner_company_name || company,
        created_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
        status: "assigned",
      };

      const perms = [
        Permission.read(Role.users()),
        Permission.update(Role.user(admin.$id)),
        Permission.delete(Role.user(admin.$id)),
      ];

      try {
        await databases.createDocument(DB_ID, COL_ASSIGN, ID.unique(), payload, perms);
      } catch (permErr) {
        console.warn("assignment create with perms failed, retrying without perms", permErr);
        await databases.createDocument(DB_ID, COL_ASSIGN, ID.unique(), payload);
      }

      await databases.updateDocument(DB_ID, COL_REQUESTS, request.$id, {
        status: "validated",
        price_partner: offer.price,
      });

      const sameReqOffers = relatedOffers(request.$id);
      await Promise.all(
        sameReqOffers.map((o) =>
          databases.updateDocument(DB_ID, COL_OFFERS, o.$id, {
            status: o.$id === offer.$id ? "accepted" : "rejected",
          })
        )
      );

      toast({
        title: t.validated ?? "Validé",
        description: t.offerAccepted ?? "L'offre a été acceptée et attribuée.",
      });
      fetchAll();
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.offerAcceptErr ?? "Échec lors de la validation de l'offre.",
        variant: "destructive",
      });
    }
  };

  const refuseOffer = async (offer: PartnerOffer) => {
    try {
      await databases.updateDocument(DB_ID, COL_OFFERS, offer.$id, { status: "rejected" });
      toast({ title: t.refused ?? "Refusé", description: t.offerRefused ?? "L'offre a été refusée." });
      fetchAll();
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.offerRefuseErr ?? "Impossible de refuser l'offre.",
        variant: "destructive",
      });
    }
  };

  // ✏️ Ouvrir / sauvegarder la modification d’une offre partenaire
  const openEditOffer = (offer: PartnerOffer) => {
    setEditingOffer(offer);
    setEditOfferPrice(String(offer.price ?? ""));
    setEditOfferMessage(offer.message ?? "");
  };

  const saveEditedOffer = async () => {
    if (!editingOffer) return;
    try {
      const v = Number(editOfferPrice);
      if (Number.isNaN(v) || v <= 0) {
        toast({
          title: t.error ?? "Erreur",
          description: t.offerEditBadPrice ?? "Prix invalide.",
          variant: "destructive",
        });
        return;
      }

      // On modifie directement l’offre du partenaire (statut inchangé)
      await databases.updateDocument(DB_ID, COL_OFFERS, editingOffer.$id, {
        price: v,
        message: editOfferMessage,
      });

      toast({ title: t.saved ?? "Enregistré", description: t.offerEdited ?? "Offre modifiée." });
      setEditingOffer(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.offerEditErr ?? "Impossible de modifier l'offre.",
        variant: "destructive",
      });
    }
  };

  // ❌ Refuser la demande
  const cancelRequest = async (id: string) => {
    try {
      await databases.updateDocument(DB_ID, COL_REQUESTS, id, { status: "canceled" });
      const roffers = offers.filter((o) => o.transport_request_id === id);
      await Promise.all(
        roffers.map((o) => databases.updateDocument(DB_ID, COL_OFFERS, o.$id, { status: "rejected" }))
      );
      setRequests((prev) => prev.map((r) => (r.$id === id ? { ...r, status: "canceled" } : r)));
      toast({ title: t.refused ?? "Refusé", description: t.requestRefused ?? "La demande a été refusée." });
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.requestRefuseErr ?? "Impossible de refuser la demande.",
        variant: "destructive",
      });
    }
  };

  // 🗑️ Suppression totale (demande + offres)
  const deleteRequestCompletely = async (id: string) => {
    try {
      const offRes = await databases.listDocuments(DB_ID, COL_OFFERS, [
        Query.equal("transport_request_id", id),
      ]);
      await Promise.all(offRes.documents.map((o: any) => databases.deleteDocument(DB_ID, COL_OFFERS, o.$id)));

      await databases.deleteDocument(DB_ID, COL_REQUESTS, id);

      setRequests((prev) => prev.filter((r) => r.$id !== id));
      setOffers((prev) => prev.filter((o) => o.transport_request_id !== id));

      toast({ title: t.deleted ?? "Supprimé", description: t.requestDeleted ?? "La demande a été supprimée." });
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.requestDeleteErr ?? "Impossible de supprimer la demande.",
        variant: "destructive",
      });
    }
  };

  // 💶 Prix définitif (string ≤ 10 chars dans ton schéma)
  const beginFinalEdit = (req: TransportRequest) => {
    const current = req.final_price ?? "";
    setFinalEdit({ id: req.$id, value: String(current) });
  };
  const cancelFinalEdit = () => setFinalEdit({ id: null, value: "" });

  const saveFinalPrice = async (req: TransportRequest) => {
    try {
      const raw = (finalEdit.value ?? "").toString().trim();
      if (!raw) {
        toast({
          title: t.error ?? "Erreur",
          description: t.finalPriceEmpty ?? "Saisis un prix.",
          variant: "destructive",
        });
        return;
      }
  
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) {
        toast({
          title: t.error ?? "Erreur",
          description: t.finalPriceBad ?? "Prix invalide.",
          variant: "destructive",
        });
        return;
      }
  
      const intVal = Math.round(n);
  
      await databases.updateDocument(DB_ID, COL_REQUESTS, req.$id, {
        final_price: intVal, // ← entier obligatoire
      });
  
      setRequests((prev) =>
        prev.map((r) => (r.$id === req.$id ? { ...r, final_price: intVal } : r))
      );
  
      cancelFinalEdit();
      toast({
        title: t.saved ?? "Enregistré",
        description: t.finalPriceSaved ?? "Prix définitif mis à jour.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.finalPriceErr ?? "Impossible d'enregistrer le prix définitif.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <Layout showSidebar>
        <div className="p-6 text-exv-text">{t.loading ?? "Chargement..."}</div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        {/* Header + filtres + recherche */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-exv-primary">{t.adminReqTitle || "Demandes de Transport"}</h1>

          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={statusFilter === "all" ? "bg-exv-accent text-exv-primary hover:opacity-90" : "bg-exv-panel text-exv-text border-exv-border"}
            >
              {t.filterAll ?? "Tous"}
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={statusFilter === "pending" ? "bg-exv-accent text-exv-primary hover:opacity-90" : "bg-exv-panel text-exv-text border-exv-border"}
            >
              {t.filterPending ?? "En attente"}
            </Button>
            <Button
              variant={statusFilter === "validated" ? "default" : "outline"}
              onClick={() => setStatusFilter("validated")}
              className={statusFilter === "validated" ? "bg-exv-accent text-exv-primary hover:opacity-90" : "bg-exv-panel text-exv-text border-exv-border"}
            >
              {t.filterValidated ?? "Validées"}
            </Button>
            <Button
              variant={statusFilter === "canceled" ? "default" : "outline"}
              onClick={() => setStatusFilter("canceled")}
              className={statusFilter === "canceled" ? "bg-exv-accent text-exv-primary hover:opacity-90" : "bg-exv-panel text-exv-text border-exv-border"}
            >
              {t.filterCanceled ?? "Refusées"}
            </Button>
          </div>

          <Input
            placeholder={t.searchPlaceholder || "Rechercher (client, ville...)"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm rounded-xl border-exv-border bg-white text-black"
          />
        </div>

        {/* Listes */}
        {filtered.map((req) => {
          const roffers = relatedOffers(req.$id);
          const validated = req.status === "validated";
          const isEditingThisFinal = finalEdit.id === req.$id;
          const finalPriceDisplay =
           typeof req.final_price === "number" ? `${req.final_price} €` : "—";


          return (
            <Card key={req.$id} className="relative border border-exv-border rounded-2xl overflow-hidden bg-exv-card text-exv-text">
              {/* suppression */}
              <button
                aria-label={t.delete ?? "Supprimer"}
                className="absolute top-3 right-3 h-7 w-7 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center shadow"
                onClick={() => {
                  setConfirmText(t.confirmDeleteRequest ?? "Supprimer définitivement cette demande ?");
                  setConfirmAction(() => () => deleteRequestCompletely(req.$id));
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>

              <CardHeader className="bg-exv-panel/40 pr-12">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-exv-sub">
                    {t.requestLabel || "Demande"} #{req.$id.slice(0, 8)} — {req.client_name}
                  </CardTitle>
                  {req.status === "canceled" && <Badge variant="destructive">{t.statusCanceled ?? "Refusée"}</Badge>}
                  {validated && <Badge variant="default">{t.statusValidated ?? "Validée"}</Badge>}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Infos demande — libellés BLANCS, valeurs GRISES */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.from || "Départ"}:</strong>
                      <span className="text-exv-sub">{req.pickup_location}</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.to || "Arrivée"}:</strong>
                      <span className="text-exv-sub">{req.dropoff_location}</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.weight || "Poids"}:</strong>
                      <span className="text-exv-sub">{req.weight} kg</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.volume || "Volume"}:</strong>
                      <span className="text-exv-sub">{req.volume} m³</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.distance || "Distance"}:</strong>
                      <span className="text-exv-sub">{req.distance_km} km</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.estimatedPrice || "Prix estimé"}:</strong>
                      <span className="text-exv-sub">{req.price_client} €</span>
                    </div>
                    <div className="flex gap-2">
                      <strong className="text-exv-text">{t.dates || "Dates"}:</strong>
                      <span className="text-exv-sub">
                        {new Date(req.pickup_date).toLocaleDateString()} → {new Date(req.delivery_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prix définitif (édition inline) */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <strong className="text-exv-text">{t.finalPriceLabel || "Prix définitif"}:</strong>
                    <span className="text-exv-sub">{finalPriceDisplay}</span>
                    {!isEditingThisFinal && (
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => beginFinalEdit(req)}
                      >
                        {t.editFinalPrice || "Modifier"}
                      </Button>
                    )}
                  </div>

                  {isEditingThisFinal && (
                    <div className="rounded-xl border border-exv-border p-3 bg-white text-black flex flex-col sm:flex-row gap-2 sm:items-center">
                      <label className="text-sm font-medium">{t.finalPriceLabel || "Prix définitif"}</label>
                      <Input
                        value={finalEdit.value}
                        onChange={(e) => setFinalEdit((p) => ({ ...p, value: e.target.value }))}
                        placeholder="350.00"
                        className="bg-white text-black max-w-[200px]"
                      />
                      <div className="ml-auto flex gap-2">
                        <Button
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() => saveFinalPrice(req)}
                        >
                          {t.save || "Valider"}
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={cancelFinalEdit}>
                          {t.cancel || "Annuler"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image jointe */}
                {req.file_id && (
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_FILES}/files/${req.file_id}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                    alt={t.photoAlt || "Photo jointe"}
                    className="w-48 rounded-xl border border-exv-border"
                  />
                )}

                {/* Offres partenaires (titre en gris) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-exv-sub">{t.partnerOffers || "Offres des partenaires"}</h3>
                  </div>

                  {roffers.length === 0 ? (
                    <div className="italic text-exv-sub">{t.noOffers || "Aucune offre pour cette demande."}</div>
                  ) : (
                    <div className="space-y-2">
                      {roffers.map((offer) => {
                        const isAccepted = offer.status === "accepted";
                        return (
                          <div
                            key={offer.$id}
                            className="border border-exv-border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white text-black"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">
                                  {offer.partner_company_name || t.unknownPartner || "Partenaire inconnu"}
                                </span>
                                {offer.status === "accepted" && <Badge variant="default">{t.statusAccepted || "Accepté"}</Badge>}
                                {offer.status === "rejected" && <Badge variant="destructive">{t.statusRefused || "Refusé"}</Badge>}
                                {!offer.status || offer.status === "pending" ? (
                                  <Badge variant="secondary">{t.statusPending || "En attente"}</Badge>
                                ) : null}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {t.offerDate || "Date de l'offre"}: {offer.$createdAt ? new Date(offer.$createdAt).toLocaleString() : "—"}
                              </div>

                              <div className="text-sm">
                                <strong>{t.offeredPrice || "Prix proposé"}:</strong> {offer.price} €
                              </div>

                              {offer.message && <div className="text-sm text-muted-foreground">{offer.message}</div>}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {!isAccepted && offer.status !== "rejected" && req.status !== "canceled" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-exv-accent text-exv-primary hover:opacity-90"
                                    onClick={() => {
                                      setConfirmText(t.confirmAcceptOffer || "Accepter cette offre ?");
                                      setConfirmAction(() => () => validateOffer(offer, req));
                                      setConfirmOpen(true);
                                    }}
                                  >
                                    {t.acceptOffer || "Accepter l'offre"}
                                  </Button>

                                  {/* Modifier l’offre (dialog) — titre noir, Annuler rouge */}
                                  <Button
                                    size="sm"
                                    className="bg-orange-500 hover:bg-orange-600 text-white"
                                    onClick={() => openEditOffer(offer)}
                                  >
                                    {t.modifyOffer || "Modifier l'offre"}
                                  </Button>

                                  <Button
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => {
                                      setConfirmText(t.confirmRejectOffer || "Refuser cette offre ?");
                                      setConfirmAction(() => () => refuseOffer(offer));
                                      setConfirmOpen(true);
                                    }}
                                  >
                                    {t.refuseOffer || "Refuser"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Refuser la demande */}
                  {req.status !== "canceled" && req.status !== "validated" && (
                    <div className="pt-1">
                      <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setConfirmText(t.confirmRejectRequest || "Refuser cette demande ?");
                          setConfirmAction(() => () => cancelRequest(req.$id));
                          setConfirmOpen(true);
                        }}
                      >
                        {t.refuseRequest || "Refuser la demande"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Dialog confirmation générique */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="rounded-2xl bg-exv-card text-exv-text border-exv-border">
            <DialogHeader>
              <DialogTitle className="text-exv-primary">{t.confirmTitle || "Confirmer l’action"}</DialogTitle>
              <DialogDescription className="text-exv-sub">
                {t.confirmDesc || "Veuillez confirmer votre choix."}
              </DialogDescription>
            </DialogHeader>
            <p className="py-2">{confirmText}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setConfirmOpen(false)}>
                {t.cancel || "Annuler"}
              </Button>
              <Button
                className="bg-exv-accent text-exv-primary hover:opacity-90"
                onClick={async () => {
                  try {
                    if (confirmAction) await confirmAction();
                  } finally {
                    setConfirmOpen(false);
                  }
                }}
              >
                {t.confirmOk || "Confirmer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Modifier l’offre partenaire */}
        <Dialog open={!!editingOffer} onOpenChange={(o) => !o && setEditingOffer(null)}>
          <DialogContent className="rounded-2xl border-exv-border bg-white text-black">
            <DialogHeader>
              <DialogTitle className="text-black">
                {t.modifyOffer || "Modifier l'offre"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t.modifyOfferDesc || "Modifier le prix et le message de l'offre du partenaire."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t.priceLabel || "Prix"}</label>
                <Input
                  type="number"
                  value={editOfferPrice}
                  onChange={(e) => setEditOfferPrice(e.target.value)}
                  placeholder="350"
                  className="bg-white text-black"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">{t.messageLabel || "Message"}</label>
                <Input
                  value={editOfferMessage}
                  onChange={(e) => setEditOfferMessage(e.target.value)}
                  placeholder={t.messagePlaceholder || "Optionnel"}
                  className="bg-white text-black"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setEditingOffer(null)}>
                {t.cancel || "Annuler"}
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={saveEditedOffer}>
                {t.save || "Enregistrer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
