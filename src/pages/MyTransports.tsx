import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface TransportRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  package_type: string;
  package_weight: number;
  distance_km: number;
  final_price: number;
  created_at: string;
}

export default function MyTransports() {
  const [transports, setTransports] = useState<TransportRequest[]>([]);
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
    fetchMyTransports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyTransports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transport_requests")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransports(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des transports:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: t.statusPending, variant: "secondary" as const },
      quoted: { label: t.statusQuoted, variant: "outline" as const },
      accepted: { label: t.statusAccepted, variant: "default" as const },
      in_progress: { label: t.statusInProgress, variant: "default" as const },
      delivered: { label: t.statusDelivered, variant: "default" as const },
      cancelled: { label: t.statusCancelled, variant: "destructive" as const },
    };
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.myTransportsTitle}</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-exv-border bg-exv-panel text-exv-text animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-exv-card rounded w-3/4 mb-2" />
                <div className="h-3 bg-exv-card rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.myTransportsTitle}</h1>
        </div>
        <Button onClick={() => navigate("/new-request")} className="bg-exv-accent text-exv-primary hover:opacity-90">
          {t.newTransportBtn}
        </Button>
      </div>

      {/* Empty */}
      {transports.length === 0 ? (
        <Card className="border-exv-border bg-exv-panel text-exv-text">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-exv-sub mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.emptyTitle}</h3>
            <p className="text-exv-sub text-center">{t.emptyDesc}</p>
            <Button onClick={() => navigate("/new-request")} className="mt-4 bg-exv-accent text-exv-primary hover:opacity-90">
              {t.emptyCta}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transports.map((transport) => {
            const statusInfo = getStatusBadge(transport.status);
            return (
              <Card key={transport.id} className="border-exv-border bg-exv-card text-exv-text hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-exv-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-4 w-4 text-exv-accent" />
                      {t.transportNumberPrefix} {transport.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* From/To */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-exv-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-exv-text">{t.labelDeparture}</p>
                          <p className="text-sm text-exv-sub">{transport.pickup_address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-exv-dark mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-exv-text">{t.labelArrival}</p>
                          <p className="text-sm text-exv-sub">{transport.destination_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-exv-sub">{t.labelType}</span>
                        <span className="text-sm font-medium text-exv-text">
                          {transport.package_type || t.notSpecified}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-exv-sub">{t.labelWeight}</span>
                        <span className="text-sm font-medium text-exv-text">{transport.package_weight || 0} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-exv-sub">{t.labelDistance}</span>
                        <span className="text-sm font-medium text-exv-text">{transport.distance_km || 0} km</span>
                      </div>
                      {typeof transport.final_price === "number" && (
                        <div className="flex justify-between">
                          <span className="text-sm text-exv-sub">{t.labelPrice}</span>
                          <span className="text-sm font-bold text-exv-accent">
                            {formatEUR(transport.final_price)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-exv-border">
                    <span className="text-xs text-exv-sub">
                      {t.createdOn} {new Date(transport.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      {(transport.status === "in_progress" || transport.status === "delivered") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-exv-border text-exv-text hover:bg-exv-panel"
                          onClick={() => navigate(`/tracking/${transport.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t.follow}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-exv-border text-exv-text hover:bg-exv-panel"
                        onClick={() => navigate(`/transport/${transport.id}`)}
                      >
                        {t.details}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
