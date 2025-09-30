// src/pages/requests.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { databases, account, ID } from "@/lib/appwrite";
import { Query, Permission, Role } from "appwrite";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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

interface TransportRequest {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  status: "pending" | "validated" | "in_progress" | "delivered" | "canceled";
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
  status?: "pending" | "accepted" | "rejected";
  $createdAt?: string;
}

const DB_ID = "transport_db";
const COL_REQUESTS = "transports_requests";
const COL_OFFERS = "partner_offers";
const COL_ASSIGN = "transport_assignments";
const BUCKET_FILES = "request_files";

type ReqFilter = "all" | "pending" | "validated" | "canceled";

export default function AdminRequests() {
  const { t } = useTranslation();

  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<ReqFilter>("all");

  // Dialog de confirmation réutilisable
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);

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

  useEffect(() => {
    fetchAll();
  }, []);

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

  const validateOffer = async (offer: PartnerOffer, request: TransportRequest) => {
    try {
      const admin = await account.get();

      // 1) Créer l’assignation (permissions document-level pour éviter 401)
      await databases.createDocument(
        DB_ID,
        COL_ASSIGN,
        ID.unique(),
        {
          transport_request_id: request.$id,
          partner_id: offer.partner_id,
          admin_id: admin.$id,
          accepted_price: offer.price,
          partner_short_id: offer.partner_short_id,
          partner_company_name: offer.partner_company_name,
          created_at: new Date().toISOString(),
          assigned_at: new Date().toISOString(),
          status: "assigned",
        },
        [
          Permission.read(Role.user(offer.partner_id)),
          Permission.read(Role.user(admin.$id)),
          Permission.update(Role.user(admin.$id)),
          Permission.delete(Role.user(admin.$id)),
        ]
      );

      // 2) Mettre la demande en "validated" + prix partenaire
      await databases.updateDocument(DB_ID, COL_REQUESTS, request.$id, {
        status: "validated",
        price_partner: offer.price,
      });

      // 3) Marquer l’offre acceptée + rejeter les autres
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
      toast({
        title: t.refused ?? "Refusé",
        description: t.offerRefused ?? "L'offre a été refusée.",
      });
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

  const cancelRequest = async (id: string) => {
    try {
      // 1) Passer la demande en canceled
      await databases.updateDocument(DB_ID, COL_REQUESTS, id, { status: "canceled" });

      // 2) Rejeter toutes les offres liées
      const roffers = offers.filter((o) => o.transport_request_id === id);
      await Promise.all(
        roffers.map((o) =>
          databases.updateDocument(DB_ID, COL_OFFERS, o.$id, { status: "rejected" })
        )
      );

      // 3) Mettre à jour le state local
      setRequests((prev) =>
        prev.map((r) => (r.$id === id ? { ...r, status: "canceled" } : r))
      );

      toast({
        title: t.refused ?? "Refusé",
        description: t.requestRefused ?? "La demande a été refusée.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.requestRefuseErr ?? "Impossible de refuser la demande.",
        variant: "destructive",
      });
    }
  };

  // Suppression totale (demande + offres + assignations)
  const deleteRequestCompletely = async (id: string) => {
    try {
      // Supprimer les offres liées
      const offRes = await databases.listDocuments(DB_ID, COL_OFFERS, [
        Query.equal("transport_request_id", id),
      ]);
      await Promise.all(
        offRes.documents.map((o: any) =>
          databases.deleteDocument(DB_ID, COL_OFFERS, o.$id)
        )
      );

      // Supprimer les assignations liées (si droits)
      try {
        const asgRes = await databases.listDocuments(DB_ID, COL_ASSIGN, [
          Query.equal("transport_request_id", id),
        ]);
        await Promise.all(
          asgRes.documents.map((a: any) =>
            databases.deleteDocument(DB_ID, COL_ASSIGN, a.$id)
          )
        );
      } catch (e) {
        console.warn("Assignments delete skipped/unauthorized", e);
      }

      // Supprimer la demande
      await databases.deleteDocument(DB_ID, COL_REQUESTS, id);

      // Nettoyer l’état local
      setRequests((prev) => prev.filter((r) => r.$id !== id));
      setOffers((prev) => prev.filter((o) => o.transport_request_id !== id));

      toast({
        title: t.deleted ?? "Supprimé",
        description: t.requestDeleted ?? "La demande a été supprimée définitivement.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: t.error ?? "Erreur",
        description: t.requestDeleteErr ?? "Impossible de supprimer la demande.",
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
        {/* Header + filtre + recherche */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-exv-primary">
            {t.adminReqTitle || "Demandes de Transport"}
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className={
                statusFilter === "all"
                  ? "bg-exv-accent text-exv-primary hover:opacity-90"
                  : "bg-exv-panel text-exv-text border-exv-border"
              }
            >
              {t.filterAll ?? "Tous"}
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
              className={
                statusFilter === "pending"
                  ? "bg-exv-accent text-exv-primary hover:opacity-90"
                  : "bg-exv-panel text-exv-text border-exv-border"
              }
            >
              {t.filterPending ?? "En attente"}
            </Button>
            <Button
              variant={statusFilter === "validated" ? "default" : "outline"}
              onClick={() => setStatusFilter("validated")}
              className={
                statusFilter === "validated"
                  ? "bg-exv-accent text-exv-primary hover:opacity-90"
                  : "bg-exv-panel text-exv-text border-exv-border"
              }
            >
              {t.filterValidated ?? "Validées"}
            </Button>
            <Button
              variant={statusFilter === "canceled" ? "default" : "outline"}
              onClick={() => setStatusFilter("canceled")}
              className={
                statusFilter === "canceled"
                  ? "bg-exv-accent text-exv-primary hover:opacity-90"
                  : "bg-exv-panel text-exv-text border-exv-border"
              }
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

        {/* List */}
        {filtered.map((req) => {
          const roffers = relatedOffers(req.$id);
          const validated = req.status === "validated";

          return (
            <Card
              key={req.$id}
              className="relative border border-exv-border rounded-2xl overflow-hidden bg-exv-card text-exv-text"
            >
              {/* bouton suppression */}
              <button
                aria-label={t.delete ?? "Supprimer"}
                className="absolute top-3 right-3 h-7 w-7 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center shadow"
                onClick={() => {
                  setConfirmText(
                    t.confirmDeleteRequest ?? "Supprimer définitivement cette demande ?"
                  );
                  setConfirmAction(() => () => deleteRequestCompletely(req.$id));
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>

              <CardHeader className="bg-exv-panel/40 pr-12">
                <CardTitle className="text-exv-sub">
                  {t.requestLabel || "Demande"} #{req.$id.slice(0, 8)} — {req.client_name}{" "}
                  {req.status === "canceled" && (
                    <Badge variant="destructive" className="ml-2">
                      {t.statusCanceled ?? "Refusée"}
                    </Badge>
                  )}
                  {validated && (
                    <Badge variant="default" className="ml-2">
                      {t.statusValidated ?? "Validée"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <p>
                    <strong>{t.from || "Départ"}:</strong> {req.pickup_location}
                  </p>
                  <p>
                    <strong>{t.to || "Arrivée"}:</strong> {req.dropoff_location}
                  </p>
                  <p>
                    <strong>{t.estimatedPrice || "Prix estimé"}:</strong> {req.price_client} €
                  </p>
                  <p>
                    <strong>{t.dates || "Dates"}:</strong>{" "}
                    {new Date(req.pickup_date).toLocaleDateString()} →{" "}
                    {new Date(req.delivery_date).toLocaleDateString()}
                  </p>
                </div>

                {req.file_id && (
                  <img
                    src={`https://cloud.appwrite.io/v1/storage/buckets/${BUCKET_FILES}/files/${req.file_id}/preview?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`}
                    alt={t.photoAlt || "Photo jointe"}
                    className="w-48 rounded-xl border border-exv-border"
                  />
                )}

                {/* Offres partenaires */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-exv-sub">{t.partnerOffers || "Offres des partenaires"}</h3>
                  </div>

                  {roffers.length === 0 ? (
                    <p className="italic text-exv-sub">{t.noOffers || "Aucune offre pour cette demande."}</p>
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

                                {offer.status === "accepted" && (
                                  <Badge variant="default">{t.statusAccepted || "Accepté"}</Badge>
                                )}
                                {offer.status === "rejected" && (
                                  <Badge variant="destructive">{t.statusRefused || "Refusé"}</Badge>
                                )}
                                {!offer.status || offer.status === "pending" ? (
                                  <Badge variant="secondary">{t.statusPending || "En attente"}</Badge>
                                ) : null}
                              </div>

                              <div className="text-sm text-muted-foreground">
                                {t.offerDate || "Date de l'offre"}:{" "}
                                {offer.$createdAt
                                  ? new Date(offer.$createdAt).toLocaleString()
                                  : "—"}
                              </div>

                              <div className="text-sm">
                                <strong>{t.offeredPrice || "Prix proposé"}:</strong> {offer.price} €
                              </div>

                              {offer.message && (
                                <div className="text-sm text-muted-foreground">
                                  {offer.message}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
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

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50"
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

                  {/* Refuser la demande (si pas validée / pas déjà refusée) */}
                  {req.status !== "canceled" && req.status !== "validated" && (
                    <div className="pt-2">
                      <Button
                        variant="destructive"
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

        {/* Dialog confirmation */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="rounded-2xl bg-exv-card text-exv-text border-exv-border">
            <DialogHeader>
              <DialogTitle className="text-exv-primary">
                {t.confirmTitle || "Confirmer l’action"}
              </DialogTitle>
              <DialogDescription className="text-exv-sub">
                {t.confirmDesc || "Veuillez confirmer votre choix."}
              </DialogDescription>
            </DialogHeader>
            <p className="py-2">{confirmText}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
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
      </div>
    </Layout>
  );
}
