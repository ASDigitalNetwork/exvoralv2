"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Query } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, Package, Eye } from "lucide-react";
import { Layout } from "@/components/Layout";
import { account, databases } from "@/lib/appwrite";
import { useTranslation } from "@/hooks/useTranslation";

const DB_ID = "transport_db";
const COL_REQUESTS = "transports_requests";
const COL_ASSIGN = "transport_assignments";

type RequestDoc = {
  $id: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_address?: string;
  destination_address?: string;
  status: "pending" | "validated" | "in_progress" | "delivered" | "canceled" | "cancelled";
  package_type?: string;
  weight?: number;
  package_weight?: number;
  distance_km?: number;
  volume?: number;
  final_price?: number;
  price_client?: number;
  created_at?: string;
};

type AssignmentDoc = {
  $id: string;
  transport_request_id: string;
  partner_id: string;
  accepted_price?: number;
  status?: "assigned" | "in_progress" | "delivered" | "cancelled" | "canceled";
  $createdAt?: string;
};

type Item = {
  request: RequestDoc;
  assignment: AssignmentDoc;
};

export default function PartnerTransports() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatEUR = useMemo(
    () => (n: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(n),
    []
  );

  useEffect(() => {
    fetchAssigned();
  }, []);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      const partnerId = user.$id;

      // 1) Récupérer les assignations de CE partenaire
      //    On prend les états utiles (assigned/in_progress/delivered). Tri par $createdAt desc.
      const asgRes = await databases.listDocuments(DB_ID, COL_ASSIGN, [
        Query.equal("partner_id", partnerId),
        Query.equal("status", ["assigned", "in_progress", "delivered"]),
        Query.orderDesc("$createdAt"),
      ]);

      const assignments = (asgRes.documents as unknown as AssignmentDoc[]) || [];
      if (assignments.length === 0) {
        setItems([]);
        return;
      }

      // 2) Récupérer toutes les demandes liées d’un coup via leurs IDs
      const requestIds = Array.from(
        new Set(assignments.map((a) => a.transport_request_id).filter(Boolean))
      );
      const reqRes = await databases.listDocuments(DB_ID, COL_REQUESTS, [
        Query.equal("$id", requestIds),
        Query.limit(100),
      ]);
      const requests = (reqRes.documents as unknown as RequestDoc[]) || [];

      // 3) Fusionner assignment + request
      const reqMap = new Map<string, RequestDoc>();
      requests.forEach((r) => reqMap.set(r.$id, r));

      const merged: Item[] = assignments
        .map((a) => {
          const req = reqMap.get(a.transport_request_id);
          if (!req) return null;
          return { assignment: a, request: req };
        })
        .filter(Boolean) as Item[];

      setItems(merged);
    } catch (error) {
      console.error("Load error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getRequestStatusBadge = (status: RequestDoc["status"]) => {
    switch (status) {
      case "pending":
        return { label: t.statusPending || "En attente", variant: "secondary" as const };
      case "validated":
        return { label: t.statusValidated || "Validée", variant: "default" as const };
      case "in_progress":
        return { label: t.statusInProgress || "En cours", variant: "default" as const };
      case "delivered":
        return { label: t.statusDelivered || "Livrée", variant: "default" as const };
      case "canceled":
      case "cancelled":
        return { label: t.statusCancelled || "Annulée", variant: "destructive" as const };
      default:
        return { label: String(status), variant: "secondary" as const };
    }
  };

  const getAssignmentStatusBadge = (status?: AssignmentDoc["status"]) => {
    switch (status) {
      case "assigned":
        return { label: t.statusValidated || "Validée", variant: "default" as const };
      case "in_progress":
        return { label: t.statusInProgress || "En cours", variant: "default" as const };
      case "delivered":
        return { label: t.statusDelivered || "Livrée", variant: "default" as const };
      case "canceled":
      case "cancelled":
        return { label: t.statusCancelled || "Annulée", variant: "destructive" as const };
      default:
        return { label: status || "-", variant: "secondary" as const };
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-exv-accent" />
            <h1 className="text-2xl font-bold text-exv-text">
              {t.partnerTransportsTitle || "Mes Transports"}
            </h1>
          </div>
          <Button
            onClick={() => navigate("/available-requests")}
            className="bg-exv-accent text-exv-primary hover:opacity-90"
          >
            {t.viewRequests || "Voir les demandes"}
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-exv-sub">{t.loading || "Chargement..."}</p>
        ) : items.length === 0 ? (
          <Card className="border-exv-border bg-exv-panel text-exv-text">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-exv-sub mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.emptyTitle || "Aucun transport"}</h3>
              <p className="text-exv-sub text-center">
                {t.emptyDesc || "Vous n'avez pas encore de transports assignés."}
              </p>
              <Button
                onClick={() => navigate("/available-requests")}
                className="mt-4 bg-exv-accent text-exv-primary hover:opacity-90"
              >
                {t.emptyCta || "Consulter les demandes"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map(({ request, assignment }) => {
              // Compat adresses
              const from = request.pickup_location || request.pickup_address || "-";
              const to = request.dropoff_location || request.destination_address || "-";

              const weight =
                typeof request.weight === "number"
                  ? request.weight
                  : request.package_weight;
              const distance = request.distance_km;
              const finalPrice =
                typeof request.final_price === "number" ? request.final_price : undefined;

              // Badges
              const reqBadge = getRequestStatusBadge(request.status);
              const asgBadge = getAssignmentStatusBadge(assignment.status);

              return (
                <Card
                  key={`${assignment.$id}-${request.$id}`}
                  className="hover:shadow-md transition-shadow bg-exv-card text-exv-text border-exv-border"
                >
                  <CardHeader className="pb-3 border-b border-exv-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-4 w-4 text-exv-accent" />
                        {t.transportNumberPrefix || "Transport #"} {request.$id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={asgBadge.variant}>
                          {asgBadge.label}
                        </Badge>
                        <Badge variant={reqBadge.variant}>
                          {reqBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelDeparture || "Départ :"}</span>
                      <span className="text-right text-exv-sub">{from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelArrival || "Arrivée :"}</span>
                      <span className="text-right text-exv-sub">{to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelWeight || "Poids :"}</span>
                      <span>{typeof weight === "number" ? `${weight} kg` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelDistance || "Distance :"}</span>
                      <span>{typeof distance === "number" ? `${distance} km` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelMyOffer || "Mon offre :"}</span>
                      <span className="text-exv-accent font-bold">
                        {typeof assignment.accepted_price === "number"
                          ? formatEUR(assignment.accepted_price)
                          : "-"}
                      </span>
                    </div>
                    {typeof finalPrice === "number" && (
                      <div className="flex justify-between">
                        <span className="text-exv-text">{t.labelFinalPrice || "Prix final :"}</span>
                        <span className="text-green-500 font-bold">{formatEUR(finalPrice)}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-exv-border mt-2">
                      <Button
                        size="sm"
                        className="bg-exv-panel border border-exv-border text-exv-text hover:bg-exv-card"
                        onClick={() => navigate(`/partner-tracking/${request.$id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> {t.manageTracking || "Gérer le suivi"}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-exv-accent text-exv-primary hover:opacity-90"
                        onClick={() => navigate(`/transport/${request.$id}`)}
                      >
                        {t.details || "Détails"}
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
