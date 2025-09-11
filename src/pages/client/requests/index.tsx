"use client";

import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface RequestItem {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number;
  volume: number;
  weight: number;
  price_client: number;
  status: 'pending' | 'validated' | 'in_progress' | 'delivered' | 'canceled';
  created_at: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatEUR = useMemo(
    () => (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n),
    []
  );

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await databases.listDocuments(
          'transport_db',
          'transports_requests',
          [Query.orderDesc('created_at')]
        );
        setRequests(res.documents as unknown as RequestItem[]);
      } catch (err) {
        toast.error(t.toastRequestsLoadError);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusInfo = (status: RequestItem['status']) => {
    switch (status) {
      case 'pending':     return { label: t.statusPending,     cls: 'text-yellow-400' };
      case 'validated':   return { label: t.statusValidated,   cls: 'text-exv-accent' };
      case 'in_progress': return { label: t.statusInProgress,  cls: 'text-purple-400' };
      case 'delivered':   return { label: t.statusDelivered,   cls: 'text-green-500' };
      case 'canceled':    return { label: t.statusCancelled,   cls: 'text-red-500' };
      default:            return { label: status,              cls: 'text-exv-sub' };
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-exv-text">{t.clientRequestsTitle}</h1>

        {loading ? (
          <p className="text-exv-sub">{t.loading}</p>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => {
              const st = statusInfo(request.status);
              return (
                <Card
                  key={request.$id}
                  className="rounded-2xl border border-exv-border bg-exv-card text-exv-text hover:shadow-lg transition"
                >
                  <CardHeader className="rounded-t-2xl bg-exv-panel border-b border-exv-border">
                    <CardTitle className="text-lg">
                      {request.pickup_location} <span className="text-exv-sub">→</span> {request.dropoff_location}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 space-y-2">
                    <p>
                      <strong className="text-exv-text">{t.labelDistance}</strong>{' '}
                      <span className="text-exv-sub">{request.distance_km} km</span>
                    </p>
                    <p>
                      <strong className="text-exv-text">{t.labelWeight}</strong>{' '}
                      <span className="text-exv-sub">{request.weight} kg</span>
                    </p>
                    <p>
                      <strong className="text-exv-text">{t.labelVolume}</strong>{' '}
                      <span className="text-exv-sub">{request.volume.toFixed(3)} m³</span>
                    </p>
                    <p>
                      <strong className="text-exv-text">{t.labelPrice}</strong>{' '}
                      <span className="text-exv-accent font-bold">{formatEUR(request.price_client)}</span>
                    </p>
                    <p>
                      <strong className="text-exv-text">{t.labelStatus}</strong>{' '}
                      <span className={st.cls}>{st.label}</span>
                    </p>

                    <Button
                      onClick={() => navigate(`/client/requests/${request.$id}`)}
                      className="mt-3 bg-exv-accent text-exv-primary hover:opacity-90 rounded-xl"
                    >
                      {t.viewDetails}
                    </Button>
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
