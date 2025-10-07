'use client';

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, Clock, CheckCircle, Truck, Euro, FileText,
} from 'lucide-react';

import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { databases, account } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface TransportRequest {
  $id: string;
  pickup: string;
  destination: string;
  status: string;
  date: string;
  description: string;
  offers: number;
  price?: number;
}

const PIE_COLORS = ['#5E778B', '#344B5D', '#0B161C', '#8AA2B4']; // palette exv

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'requests' | 'invoices'>('overview');

  const formatEUR = useMemo(
    () => (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n),
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await account.get();
        const userId = user.$id;

        const res = await databases.listDocuments('transport_db', 'transports_requests', [
          Query.equal('client_id', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ]);

        const cleaned = res.documents.map(doc => ({
          $id: doc.$id,
          pickup: doc.pickup,
          destination: doc.destination,
          status: doc.status,
          date: doc.date,
          description: doc.description,
          offers: doc.offers,
          price: doc.price,
        })) as TransportRequest[];

        setRequests(cleaned);
      } catch (err) {
        console.error('Erreur fetch requests:', err);
        setRequests([]);
      }
    };

    fetchData();
  }, []);

  const stats = [
    {
      titre: t.statOpenRequests, // "Demandes en cours"
      valeur: requests.filter(r => r.status === 'pending').length,
      icone: <Clock className="h-5 w-5" />,
      couleur: 'text-exv-accent',
    },
    {
      titre: t.statValidatedTransports, // "Transports validés"
      valeur: requests.filter(r => r.status === 'validated').length,
      icone: <CheckCircle className="h-5 w-5" />,
      couleur: 'text-exv-accent',
    },
    {
      titre: t.statTotalRevenue, // "Chiffre d’affaires total"
      valeur: formatEUR(
        requests.reduce((total, r) => (r.status === 'validated' ? total + (r.price || 0) : total), 0)
      ),
      icone: <Euro className="h-5 w-5" />,
      couleur: 'text-exv-accent',
    },
    {
      titre: t.statAllRequests, // "Toutes mes demandes"
      valeur: requests.length,
      icone: <FileText className="h-5 w-5" />,
      couleur: 'text-exv-accent',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'validated':
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'inProgress': return <Truck className="h-4 w-4" />;
      case 'completed': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t.statusPending;
      case 'validated': return t.statusValidated;
      case 'approved': return t.statusApproved;
      case 'inProgress': return t.statusInProgress;
      case 'completed': return t.statusCompleted;
      default: return status;
    }
  };

  const revenueByDate = Object.values(
    requests.reduce((acc, r) => {
      const d = new Date(r.date).toLocaleDateString();
      if (!acc[d]) acc[d] = { date: d, total: 0 };
      acc[d].total += r.price || 0;
      return acc;
    }, {} as Record<string, { date: string, total: number }>)
  );

  const statusDistribution = Object.values(
    requests.reduce((acc, r) => {
      if (!acc[r.status]) acc[r.status] = { name: getStatusLabel(r.status), value: 0 };
      acc[r.status].value++;
      return acc;
    }, {} as Record<string, { name: string, value: number }>)
  );

  return (
    <div className="p-4">
      <Card className="bg-exv-card text-exv-text border border-exv-border shadow-xl rounded-3xl">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t.dashboardTitle}</h1>
              <p className="text-exv-sub">{t.dashboardWelcome}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => navigate('/invoices')}
                size="lg"
                className="bg-exv-panel hover:opacity-90 text-exv-text border border-exv-border"
              >
                <FileText className="h-4 w-4 mr-2" /> {t.btnInvoices}
              </Button>
              <Button
                onClick={() => navigate('/new-request')}
                size="lg"
                className="bg-exv-accent hover:opacity-90 text-exv-primary"
              >
                <Plus className="h-4 w-4 mr-2" /> {t.btnNewRequest}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-10">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-exv-panel border border-exv-border shadow text-exv-text">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-exv-sub">{stat.titre}</p>
                      <p className="text-2xl font-bold">{stat.valeur}</p>
                    </div>
                    <div className={stat.couleur}>{stat.icone}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-exv-panel border border-exv-border rounded-full p-1 w-fit shadow-inner">
            {[
              { key: 'overview', label: t.tabOverview },
              { key: 'requests', label: t.tabRequests },
              { key: 'invoices', label: t.tabInvoices },
            ].map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                variant={selectedTab === tab.key ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full px-4',
                  selectedTab === tab.key
                    ? 'bg-exv-accent text-exv-primary'
                    : 'text-exv-text hover:bg-exv-card'
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Overview */}
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent shipments */}
              <Card className="bg-exv-panel text-exv-text border border-exv-border shadow">
                <CardHeader>
                  <CardTitle>{t.sectionMyTransports}</CardTitle>
                  <CardDescription className="text-exv-sub">{t.sectionMyTransportsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.filter(r => r.status === 'validated').slice(0, 3).map((request) => (
                    <div
                      key={request.$id}
                      className="flex items-center justify-between p-3 bg-exv-card rounded-xl border border-exv-border"
                    >
                      <div className="flex-1">
                        <div className="flex gap-2 mb-1 text-sm font-medium">
                          <span>{request.pickup}</span>
                          <span className="text-exv-sub">→</span>
                          <span>{request.destination}</span>
                        </div>
                        <p className="text-xs text-exv-sub">{request.description}</p>
                      </div>
                      <Badge className="bg-exv-panel border border-exv-border text-exv-text text-xs flex items-center gap-1 px-2 py-1 rounded-full">
                        {getStatusIcon(request.status)} {getStatusLabel(request.status)}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Charts */}
              <Card className="bg-exv-panel text-exv-text border border-exv-border shadow">
                <CardHeader>
                  <CardTitle>{t.sectionStats}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-48 bg-exv-card border border-exv-border rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueByDate}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3C49" />
                        <XAxis dataKey="date" stroke="#C9D6DF" />
                        <YAxis stroke="#C9D6DF" />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#5E778B" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-48 bg-exv-card border border-exv-border rounded-xl p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {statusDistribution.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
