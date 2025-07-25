import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Truck, 
  Euro, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Settings,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from 'sonner';

interface Stats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalRevenue: number;
  activePartners: number;
  totalUsers: number;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_validated: boolean;
  role: string;
  created_at: string;
}

interface TransportRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  distance_km: number;
  estimated_price: number;
  created_at: string;
  client_email: string;
  package_type: string;
  package_weight: number;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  payment_date: string;
  transport_request_id: string;
  client_email: string;
  partner_email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
    totalRevenue: 0,
    activePartners: 0,
    totalUsers: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Charger les statistiques
      const [
        { data: requestsData },
        { data: invoicesData },
        { data: usersData },
      ] = await Promise.all([
        supabase.from('transport_requests').select('status, estimated_price'),
        supabase.from('invoices').select('amount, status'),
        supabase.from('profiles').select('id'),
      ]);

      const totalRequests = requestsData?.length || 0;
      const pendingRequests = requestsData?.filter(r => r.status === 'pending').length || 0;
      const completedRequests = requestsData?.filter(r => r.status === 'delivered').length || 0;
      const totalRevenue = invoicesData?.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0) || 0;

      setStats({
        totalRequests,
        pendingRequests,
        completedRequests,
        totalRevenue,
        activePartners: 0, // À calculer selon vos besoins
        totalUsers: usersData?.length || 0,
      });

      // Charger les utilisateurs avec leurs rôles
      const { data: usersWithRoles } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone_number,
          is_validated,
          created_at,
          user_roles (role)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setUsers(usersWithRoles?.map(user => ({
        ...user,
        role: Array.isArray(user.user_roles) ? user.user_roles[0]?.role || 'client' : 'client'
      })) || []);

      // Charger les demandes récentes
      const { data: recentRequests } = await supabase
        .from('transport_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setRequests(recentRequests?.map(req => ({
        ...req,
        client_email: 'N/A'
      })) || []);

      // Charger les factures récentes
      const { data: recentInvoices } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setInvoices(recentInvoices?.map(inv => ({
        ...inv,
        client_email: 'N/A',
        partner_email: 'N/A'
      })) || []);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateUser = async (userId: string, validate: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_validated: validate })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Utilisateur ${validate ? 'validé' : 'rejeté'} avec succès`);
      loadDashboardData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'En attente' },
      quoted: { variant: 'default' as const, label: 'Devisé' },
      accepted: { variant: 'default' as const, label: 'Accepté' },
      in_progress: { variant: 'default' as const, label: 'En cours' },
      delivered: { variant: 'default' as const, label: 'Livré' },
      cancelled: { variant: 'destructive' as const, label: 'Annulé' },
      paid: { variant: 'default' as const, label: 'Payée' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de la plateforme Exvoral Transports
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              +20% depuis le mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Demandes à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Livraisons réussies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">
              Revenus totaux
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partenaires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePartners}</div>
            <p className="text-xs text-muted-foreground">
              Partenaires actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs inscrits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Gestion Utilisateurs</TabsTrigger>
          <TabsTrigger value="requests">Demandes</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Utilisateurs</CardTitle>
              <CardDescription>
                Validez ou rejetez les inscriptions des nouveaux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.role === 'client' ? 'Client' : 
                           user.role === 'partner' ? 'Partenaire' : 
                           user.role === 'admin' ? 'Admin' : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_validated ? (
                          <Badge variant="default">Validé</Badge>
                        ) : (
                          <Badge variant="secondary">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!user.is_validated && (
                            <Button
                              size="sm"
                              onClick={() => handleValidateUser(user.id, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidateUser(user.id, false)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Transport</CardTitle>
              <CardDescription>
                Toutes les demandes de transport sur la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Trajet</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Type/Poids</TableHead>
                    <TableHead>Prix estimé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.client_email}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.pickup_address.substring(0, 30)}...</div>
                          <div className="text-muted-foreground">
                            → {request.destination_address.substring(0, 30)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{request.distance_km} km</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{request.package_type}</div>
                          <div className="text-muted-foreground">{request.package_weight} kg</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.estimated_price}€</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Factures</CardTitle>
              <CardDescription>
                Toutes les factures et paiements de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Partenaire</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>Date création</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.client_email}
                      </TableCell>
                      <TableCell>{invoice.partner_email}</TableCell>
                      <TableCell className="font-bold">{invoice.amount}€</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {invoice.payment_date ? 
                          new Date(invoice.payment_date).toLocaleDateString('fr-FR') : 
                          'Non payée'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analyses de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Taux de conversion</span>
                    <span className="font-bold">73%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Satisfaction client</span>
                    <span className="font-bold">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Temps moyen de livraison</span>
                    <span className="font-bold">2.3 jours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Marge moyenne</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Croissance mensuelle</span>
                      <span className="text-green-600 font-bold">+18%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Nouveaux partenaires</span>
                      <span className="text-blue-600 font-bold">+12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}