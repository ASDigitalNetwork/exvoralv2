'use client';

import { useEffect, useState } from 'react';
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
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import { account } from '@/lib/appwrite';

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

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'requests' | 'invoices'>('overview');

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
      titre: 'Demandes en cours',
      valeur: requests.filter(r => r.status === 'pending').length,
      icone: <Clock className="h-5 w-5" />,
      couleur: 'text-yellow-600',
    },
    {
      titre: 'Transports validés',
      valeur: requests.filter(r => r.status === 'validated').length,
      icone: <CheckCircle className="h-5 w-5" />,
      couleur: 'text-green-600',
    },
    {
      titre: 'Chiffre d’affaires total',
      valeur: `${requests.reduce((total, r) => r.status === 'validated' ? total + (r.price || 0) : total, 0)}€`,
      icone: <Euro className="h-5 w-5" />,
      couleur: 'text-indigo-600',
    },
    {
      titre: 'Toutes mes demandes',
      valeur: requests.length,
      icone: <FileText className="h-5 w-5" />,
      couleur: 'text-blue-600',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'inProgress': return <Truck className="h-4 w-4" />;
      case 'completed': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
      if (!acc[r.status]) acc[r.status] = { name: r.status, value: 0 };
      acc[r.status].value++;
      return acc;
    }, {} as Record<string, { name: string, value: number }>)
  );

  return (
    <div className="p-4">
      <Card className="bg-gray-100 text-black shadow-xl rounded-3xl">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Tableau de bord</h1>
              <p className="text-gray-500">Bienvenue sur votre espace client</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => navigate('/invoices')} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">
                <FileText className="h-4 w-4 mr-2" /> Factures
              </Button>
              <Button onClick={() => navigate('/new-request')} size="lg" className="bg-orange-500 hover:bg-orange-400 text-white">
                <Plus className="h-4 w-4 mr-2" /> Nouvelle demande
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white border shadow text-black">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.titre}</p>
                      <p className="text-2xl font-bold">{stat.valeur}</p>
                    </div>
                    <div className={stat.couleur}>{stat.icone}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-2 bg-gray-300 rounded-full p-1 w-fit shadow-inner">
            {[
              { key: 'overview', label: 'Tableau de bord' },
              { key: 'requests', label: 'Mes demandes' },
              { key: 'invoices', label: 'Mes factures' },
            ].map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                variant={selectedTab === tab.key ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'rounded-full px-4',
                  selectedTab === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'text-black hover:bg-white/50'
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card className="bg-white text-black border shadow">
                <CardHeader>
                  <CardTitle>Mes transports</CardTitle>
                  <CardDescription className="text-gray-500">Suivi de vos transports récents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requests.filter(r => r.status === 'validated').slice(0, 3).map((request) => (
                    <div
                      key={request.$id}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-xl shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="flex gap-2 mb-1 text-sm font-medium">
                          <span>{request.pickup}</span>
                          <span className="text-gray-400">→</span>
                          <span>{request.destination}</span>
                        </div>
                        <p className="text-xs text-gray-500">{request.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-gray-300 text-gray-800 text-xs flex items-center gap-1 px-2 py-1 rounded-full">
                        {getStatusIcon(request.status)} {request.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white text-black border shadow">
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-48">
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
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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