"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Truck,
  Euro,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { useTranslation } from "@/hooks/useTranslation";

type UserDoc = {
  $id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  is_validated?: boolean;
  role?: "client" | "partner" | "admin" | string;
  email?: string; // si stocké
  contact_email?: string; // fallback si existant
  created_at?: string; // facultatif selon ton schéma
  $createdAt?: string;
};

type RequestDoc = {
  $id: string;
  client_id?: string;
  pickup_location?: string;
  dropoff_location?: string;
  distance_km?: number;
  status: string;
  package_type?: string;
  package_weight?: number;
  price_client?: number;        // utilisé dans tes pages
  estimated_price?: number;     // fallback si tu as un autre champ
  created_at?: string;
  $createdAt?: string;
};

type InvoiceDoc = {
  $id: string;
  amount?: number;
  status?: string; // paid / unpaid / ...
  payment_date?: string | null;
  transport_request_id?: string;
  client_id?: string;
  partner_id?: string;
  created_at?: string;
  $createdAt?: string;
};

const DB_ID = "transport_db";
const COL_USERS = "user_profiles";
const COL_REQUESTS = "transports_requests";
const COL_INVOICES = "invoices";

export default function AdminDashboard() {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [requests, setRequests] = useState<RequestDoc[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);

  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((r) => r.status === "pending").length;
    const completedRequests = requests.filter((r) =>
      ["delivered", "completed"].includes(r.status)
    ).length;

    const paidStatuses = new Set(["paid", "settled", "paid_out"]);
    const totalRevenue =
      invoices
        .filter((i) => (i.status ? paidStatuses.has(i.status) : false))
        .reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

    const activePartners = users.filter(
      (u) => u.role === "partner" && u.is_validated
    ).length;

    return {
      totalRequests,
      pendingRequests,
      completedRequests,
      totalRevenue,
      activePartners,
      totalUsers: users.length,
    };
  }, [users, requests, invoices]);

  const safeDate = (item: { created_at?: string; $createdAt?: string }) =>
    item?.created_at || item?.$createdAt || "";

  const short = (s?: string) => (s ? (s.length > 30 ? s.slice(0, 30) + "…" : s) : "—");

  const displayPrice = (r: RequestDoc) =>
    (r.price_client ?? r.estimated_price ?? 0).toFixed(2);

  const statusBadge = (status: string) => {
    const map: Record<
      string,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      pending: { variant: "secondary", label: t.statusPending },
      validated: { variant: "default", label: t.statusValidated || "Validée" },
      in_progress: { variant: "default", label: t.statusInProgress },
      delivered: { variant: "default", label: t.statusDelivered },
      canceled: { variant: "destructive", label: t.statusCanceled },
      cancelled: { variant: "destructive", label: t.statusCanceled },
      paid: { variant: "default", label: t.paid || "Payée" },
    };
    const conf = map[status] || { variant: "secondary", label: status };
    return <Badge variant={conf.variant}>{conf.label}</Badge>;
  };

  const load = async () => {
    setIsLoading(true);
    try {
      // Users
      const usersRes = await databases.listDocuments(DB_ID, COL_USERS, [
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]);
      const userDocs = usersRes.documents as unknown as UserDoc[];
      setUsers(userDocs);

      // Requests
      const reqRes = await databases.listDocuments(DB_ID, COL_REQUESTS, [
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]);
      const reqDocs = reqRes.documents as unknown as RequestDoc[];
      setRequests(reqDocs);

      // Invoices (si la collection existe)
      try {
        const invRes = await databases.listDocuments(DB_ID, COL_INVOICES, [
          Query.orderDesc("$createdAt"),
          Query.limit(500),
        ]);
        const invDocs = invRes.documents as unknown as InvoiceDoc[];
        setInvoices(invDocs);
      } catch {
        setInvoices([]); // Si pas de collection, on ignore
      }
    } catch (e) {
      console.error(e);
      // Pas de toast ici pour rester discret si la collection "invoices" n'existe pas
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateUser = async (userDocId: string, validated: boolean) => {
    try {
      await databases.updateDocument(DB_ID, COL_USERS, userDocId, {
        is_validated: validated,
      });
      await load();
    } catch (e) {
      console.error(e);
      alert(t.adminActionError);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.adminTitle}</h1>
          <p className="text-muted-foreground">{t.adminSubtitle}</p>
        </div>
        <Button onClick={load} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          {t.refresh}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statTotalRequests}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">{t.statHintTotal}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statPending}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">{t.statHintPending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statCompleted}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRequests}</div>
            <p className="text-xs text-muted-foreground">{t.statHintCompleted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statRevenue}</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">{t.statHintRevenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statPartners}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePartners}</div>
            <p className="text-xs text-muted-foreground">{t.statHintPartners}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.statUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{t.statHintUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">{t.tabUsers}</TabsTrigger>
          <TabsTrigger value="requests">{t.tabRequests}</TabsTrigger>
          <TabsTrigger value="invoices">{t.tabInvoices}</TabsTrigger>
          <TabsTrigger value="analytics">{t.tabAnalytics}</TabsTrigger>
        </TabsList>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.usersTitle}</CardTitle>
              <CardDescription>{t.usersDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.user}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{t.role}</TableHead>
                    <TableHead>{t.statusLabel}</TableHead>
                    <TableHead>{t.registeredAt}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.$id}>
                      <TableCell className="font-medium">
                        {(u.first_name || "—") + " " + (u.last_name || "")}
                      </TableCell>
                      <TableCell>{u.email || u.contact_email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {u.role === "client"
                            ? t.roleClient
                            : u.role === "partner"
                            ? t.rolePartner
                            : u.role === "admin"
                            ? "Admin"
                            : u.role || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_validated ? (
                          <Badge variant="default">{t.validated}</Badge>
                        ) : (
                          <Badge variant="secondary">{t.statusPending}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(safeDate(u)).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!u.is_validated && (
                            <Button size="sm" onClick={() => validateUser(u.$id, true)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => validateUser(u.$id, false)}
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

        {/* Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.requestsTitle}</CardTitle>
              <CardDescription>{t.requestsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.client}</TableHead>
                    <TableHead>{t.route}</TableHead>
                    <TableHead>{t.distance}</TableHead>
                    <TableHead>{t.typeWeight}</TableHead>
                    <TableHead>{t.estimatedPrice}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.date}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.$id}>
                      <TableCell className="font-medium">
                        {r.client_id || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{short(r.pickup_location)}</div>
                          <div className="text-muted-foreground">
                            → {short(r.dropoff_location)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{r.distance_km ?? 0} km</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{r.package_type || "—"}</div>
                          <div className="text-muted-foreground">
                            {(r.package_weight || 0) + " kg"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{displayPrice(r)}€</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>{new Date(safeDate(r)).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.invoicesTitle}</CardTitle>
              <CardDescription>{t.invoicesDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.client}</TableHead>
                    <TableHead>{t.partner}</TableHead>
                    <TableHead>{t.amount}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.paymentDate}</TableHead>
                    <TableHead>{t.createdAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.$id}>
                      <TableCell className="font-medium">
                        {inv.client_id || "—"}
                      </TableCell>
                      <TableCell>{inv.partner_id || "—"}</TableCell>
                      <TableCell className="font-bold">
                        {(inv.amount || 0).toFixed(2)}€
                      </TableCell>
                      <TableCell>{statusBadge(inv.status || "")}</TableCell>
                      <TableCell>
                        {inv.payment_date
                          ? new Date(inv.payment_date).toLocaleDateString()
                          : t.unpaid}
                      </TableCell>
                      <TableCell>
                        {new Date(safeDate(inv)).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics (placeholder, texte traduit) */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t.analyticsTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t.convRate}</span>
                    <span className="font-bold">73%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t.csat}</span>
                    <span className="font-bold">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t.avgDelivery}</span>
                    <span className="font-bold">2.3 {t.days}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t.avgMargin}</span>
                    <span className="font-bold">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.trends}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>{t.monthlyGrowth}</span>
                      <span className="text-green-600 font-bold">+18%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "75%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>{t.newPartners}</span>
                      <span className="text-blue-600 font-bold">+12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }} />
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
