"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { databases } from "@/lib/appwrite";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

type RequestDoc = {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number;
  volume: number;
  weight: number;
  price_client: number;
  status: "pending" | "validated" | "in_progress" | "delivered" | "canceled";
  pickup_date: string;
  delivery_date: string;
  created_at: string;
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<RequestDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);
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
    const fetchRequest = async () => {
      try {
        const res = await databases.getDocument("transport_db", "transports_requests", id!);
        setRequest(res as unknown as RequestDoc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRequest();
  }, [id]);

  const exportPDF = () => {
    if (!pdfRef.current || typeof window === "undefined" || !request) return;

    const opt = {
      margin: 0.5,
      filename: `transport-request-${request.pickup_location}-${request.dropoff_location}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(pdfRef.current).save();
  };

  const statusText = (s: RequestDoc["status"]) => {
    switch (s) {
      case "pending": return t.statusPending;
      case "validated": return t.statusValidated;
      case "in_progress": return t.statusInProgress;
      case "delivered": return t.statusDelivered;
      case "canceled": return t.statusCancelled;
      default: return s;
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate("/client/requests")}
          className="border-exv-border text-exv-text hover:bg-exv-panel"
        >
          ← {t.back}
        </Button>

        <h1 className="text-2xl font-bold text-exv-text">{t.requestDetailTitle}</h1>

        {loading ? (
          <p className="text-exv-sub">{t.loading}</p>
        ) : request ? (
          <Card ref={pdfRef} className="bg-white text-black rounded-2xl shadow-xl border border-exv-border">
            <CardHeader className="flex items-center justify-between border-b rounded-t-2xl bg-exv-panel text-exv-text">
              <div className="flex w-full items-center justify-between p-4">
                {/* garde un logo lisible sur fond sombre */}
                <img src="/logo-exvoral.png" alt="Exvoral Transport" className="h-12" />
                <div className="text-right">
                  <CardTitle className="text-xl">{t.routeSheet}</CardTitle>
                  <p className="text-sm text-exv-sub">
                    {t.generatedOn} {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-2 text-sm">
              <p><strong>{t.labelRequestId}</strong> {request.$id}</p>
              <p><strong>{t.labelRoute}</strong> {request.pickup_location} <span className="text-gray-500">→</span> {request.dropoff_location}</p>
              <p><strong>{t.labelDistance}</strong> {request.distance_km} km</p>
              <p>
                <strong>{t.labelEstimatedPrice}</strong>{" "}
                <span className="text-exv-accent font-semibold">{formatEUR(request.price_client)}</span>
              </p>
              <p><strong>{t.labelVolume}</strong> {request.volume} m³</p>
              <p><strong>{t.labelWeight}</strong> {request.weight} kg</p>
              <p><strong>{t.labelPickupDate}</strong> {new Date(request.pickup_date).toLocaleDateString()}</p>
              <p><strong>{t.labelDeliveryDate}</strong> {new Date(request.delivery_date).toLocaleDateString()}</p>
              <p><strong>{t.labelStatus}</strong> {statusText(request.status)}</p>
              <p><strong>{t.createdOn}</strong> {new Date(request.created_at).toLocaleDateString()}</p>

              <div className="pt-6 mt-4 border-t text-xs text-center text-gray-600">
                <p>Exvoral Transport | contact@exvoral.com | +41 79 123 45 67</p>
                <p>www.exvoral.com</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-exv-sub">{t.requestNotFound}</p>
        )}

        {!loading && request && (
          <Button
            onClick={exportPDF}
            className="bg-exv-accent text-exv-primary hover:opacity-90 mt-2 rounded-xl"
          >
            {t.generatePDF}
          </Button>
        )}
      </div>
    </Layout>
  );
}
