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

// --- Types ---
type Assignment = {
  $id: string;
  transport_request_id: string;
  partner_id: string;
  accepted_price?: number;
  status?: "assigned" | "in_progress" | "delivered" | "canceled" | "cancelled";
  created_at?: string;
  assigned_at?: string;
};

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

type Joined = {
  asg: Assignment;
  req: RequestDoc;
};

export default function PartnerTransports() {
  const [items, setItems] = useState<Joined[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatEUR = useMemo(
    () => (n?: number) =>
      typeof n === "number"
        ? new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n)
        : "-",
    []
  );

  useEffect(() => {
    fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssigned = async () => {
    try {
      setLoading(true);
      const user = await account.get();
      const partnerId = user.$id;

      // 1) Récupérer TOUTES les assignations de ce partenaire
      const asgRes = await databases.listDocuments(DB_ID, COL_ASSIGN, [
        Query.equal("partner_id", partnerId),
        Query.orderDesc("$createdAt"),
      ]);
      const assignments = (asgRes.documents as unknown as Assignment[]) || [];
      if (assignments.length === 0) {
        setItems([]);
        return;
      }

      // 2) Batch fetch des demandes liées
      const ids = assignments.map((a) => a.transport_request_id).filter(Boolean);
      const requests = await fetchRequestsByIds(ids);

      // 3) Joindre
      const joined: Joined[] = assignments
        .map((asg) => {
          const req = requests.find((r) => r.$id === asg.transport_request_id);
          return req ? { asg, req } : null;
        })
        .filter(Boolean) as Joined[];

      setItems(joined);
    } catch (error) {
      console.error("Load error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Batch car Appwrite limite le nombre de valeurs dans un Query.equal sur $id
  const fetchRequestsByIds = async (ids: string[], chunkSize = 25): Promise<RequestDoc[]> => {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));

    const results: RequestDoc[] = [];
    for (const ch of chunks) {
      const res = await databases.listDocuments(DB_ID, COL_REQUESTS, [Query.equal("$id", ch)]);
      results.push(...((res.documents as unknown as RequestDoc[]) || []));
    }
    return results;
  };

  const badgeForRequestStatus = (status: RequestDoc["status"]) => {
    switch (status) {
      case "pending":
        return { label: t.statusPending, variant: "secondary" as const };
      case "validated":
        return { label: t.statusValidated, variant: "default" as const };
      case "in_progress":
        return { label: t.statusInProgress, variant: "default" as const };
      case "delivered":
        return { label: t.statusDelivered, variant: "default" as const };
      case "canceled":
      case "cancelled":
        return { label: t.statusCancelled, variant: "destructive" as const };
      default:
        return { label: String(status), variant: "secondary" as const };
    }
  };

  const badgeForAssignmentStatus = (status?: Assignment["status"]) => {
    switch (status) {
      case "assigned":
        return { label: t.asgAssigned ?? "Assigné", variant: "secondary" as const };
      case "in_progress":
        return { label: t.statusInProgress, variant: "default" as const };
      case "delivered":
        return { label: t.statusDelivered, variant: "default" as const };
      case "canceled":
      case "cancelled":
        return { label: t.statusCancelled, variant: "destructive" as const };
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
            <h1 className="text-2xl font-bold text-exv-text">{t.partnerTransportsTitle}</h1>
          </div>
          <Button
            onClick={() => navigate("/available-requests")}
            className="bg-exv-accent text-exv-primary hover:opacity-90"
          >
            {t.viewRequests}
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-exv-sub">{t.loading}</p>
        ) : items.length === 0 ? (
          <Card className="border-exv-border bg-exv-panel text-exv-text">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-exv-sub mb-4" />
              <h3 className="text-lg font-medium mb-2">{t.emptyTitle}</h3>
              <p className="text-exv-sub text-center">{t.emptyDesc}</p>
              <Button
                onClick={() => navigate("/available-requests")}
                className="mt-4 bg-exv-accent text-exv-primary hover:opacity-90"
              >
                {t.emptyCta}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {items.map(({ asg, req }) => {
              const from = req.pickup_location || req.pickup_address || "-";
              const to = req.dropoff_location || req.destination_address || "-";
              const weight = typeof req.weight === "number" ? req.weight : req.package_weight;
              const distance = req.distance_km;
              const finalPrice = typeof req.final_price === "number" ? req.final_price : undefined;

              const reqBadge = badgeForRequestStatus(req.status);
              const asgBadge = badgeForAssignmentStatus(asg.status);

              return (
                <Card
                  key={`${asg.$id}_${req.$id}`}
                  className="hover:shadow-md transition-shadow bg-exv-card text-exv-text border-exv-border"
                >
                  <CardHeader className="pb-3 border-b border-exv-border">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-4 w-4 text-exv-accent" />
                        {t.transportNumberPrefix ?? "Transport #"} {req.$id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={asgBadge.variant}>{asgBadge.label}</Badge>
                        <Badge variant={reqBadge.variant}>{reqBadge.label}</Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelDeparture || "Départ:"}</span>
                      <span className="text-right text-exv-sub">{from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelArrival || "Arrivée:"}</span>
                      <span className="text-right text-exv-sub">{to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelWeight || "Poids:"}</span>
                      <span>{typeof weight === "number" ? `${weight} kg` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.labelDistance || "Distance:"}</span>
                      <span>{typeof distance === "number" ? `${distance} km` : "-"}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-exv-text">{t.assignmentPrice ?? "Prix accepté:"}</span>
                      <span className="text-exv-accent font-bold">{formatEUR(asg.accepted_price)}</span>
                    </div>

                    {typeof finalPrice === "number" && (
                      <div className="flex justify-between">
                        <span className="text-exv-text">{t.labelFinalPrice || "Prix final:"}</span>
                        <span className="text-green-500 font-bold">{formatEUR(finalPrice)}</span>
                      </div>
                    )}

                    {(asg.assigned_at || asg.created_at) && (
                      <div className="flex justify-between">
                        <span className="text-exv-text">{t.assignedAt ?? "Attribué le:"}</span>
                        <span className="text-exv-sub">
                          {new Date(asg.assigned_at || asg.created_at!).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-exv-border mt-2">
                      <Button
                        size="sm"
                        className="bg-exv-panel border border-exv-border text-exv-text hover:bg-exv-card"
                        onClick={() => navigate(`/partner-tracking/${req.$id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> {t.manageTracking || "Gérer le suivi"}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-exv-accent text-exv-primary hover:opacity-90"
                        onClick={() => navigate(`/transport/${req.$id}`)}
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
