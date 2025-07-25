// RequestDetail.tsx
"use client";

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { databases, storage } from "@/lib/appwrite";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await databases.getDocument("transport_db", "transports_requests", id!);
        setRequest(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const exportPDF = () => {
    if (!pdfRef.current || typeof window === "undefined") return;

    const opt = {
      margin: 0.5,
      filename: `transport-request-${request?.pickup_location}-${request?.dropoff_location}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    // @ts-ignore
    window.html2pdf().set(opt).from(pdfRef.current).save();
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/client/requests")}>⬅ Back</Button>
        <h1 className="text-2xl font-bold text-blue-900">Transport Request Summary</h1>

        {loading ? (
          <p>Loading...</p>
        ) : request ? (
          <div className="space-y-6 bg-white p-6 rounded-xl shadow-xl" ref={pdfRef}>
            <div className="flex items-center justify-between border-b pb-4">
              <img src="/logo-exvoral.png" alt="Exvoral Logo" className="h-14" />
              <div className="text-right">
                <h2 className="text-xl font-semibold text-blue-900">Route Sheet</h2>
                <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="text-sm text-gray-800 space-y-2">
              <p><strong>Request ID:</strong> {request.$id}</p>
              <p><strong>Route:</strong> {request.pickup_location} → {request.dropoff_location}</p>
              <p><strong>Distance:</strong> {request.distance_km} km</p>
              <p><strong>Estimated Price:</strong> <span className="text-orange-500 font-semibold">{request.price_client} €</span></p>
              <p><strong>Volume:</strong> {request.volume} m³</p>
              <p><strong>Weight:</strong> {request.weight} kg</p>
              <p><strong>Pickup Date:</strong> {new Date(request.pickup_date).toLocaleDateString()}</p>
              <p><strong>Delivery Date:</strong> {new Date(request.delivery_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {request.status}</p>
              <p><strong>Created on:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
            </div>

            <div className="pt-6 border-t text-xs text-gray-500 text-center">
              <p>Exvoral Transports | contact@exvoral.com | +41 79 123 45 67</p>
              <p>www.exvoral.com</p>
            </div>
          </div>
        ) : (
          <p>Request not found</p>
        )}

        {!loading && request && (
          <Button onClick={exportPDF} className="bg-orange-400 hover:bg-orange-500 text-white mt-4">Generate PDF</Button>
        )}
      </div>
    </Layout>
  );
}