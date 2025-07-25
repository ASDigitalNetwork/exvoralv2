// FacturesPage.tsx
"use client";

import { useEffect, useState } from "react";
import { databases, account } from "@/lib/appwrite";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCcw } from "lucide-react";
import { Query } from "appwrite";

interface Invoice {
  $id: string;
  amount: number;
  platform_fee: number;
  partner_amount: number;
  status: string;
  payment_date: string | null;
  created_at: string;
  transport_request_id: string;
}

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const user = await account.get();
      const filters = [Query.equal("client_id", user.$id)];
      if (filter !== "all") filters.push(Query.equal("status", filter));
      const res = await databases.listDocuments("transport_db", "payments", filters);
      setInvoices(res.documents);
    } catch (error) {
      console.error("Erreur de chargement des factures:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      paid: { label: "Payée", variant: "default" },
      pending: { label: "En attente", variant: "outline" },
      refunded: { label: "Remboursée", variant: "secondary" },
      cancelled: { label: "Annulée", variant: "destructive" },
    }[status] || { label: status, variant: "secondary" };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePay = async (invoice: Invoice) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: invoice.amount,
          invoiceId: invoice.$id,
          transportRequestId: invoice.transport_request_id,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Erreur de paiement:", error);
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">Mes factures</h1>
          <div className="flex gap-2 items-center">
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-blue-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">📋 Toutes</option>
              <option value="paid">✅ Payée</option>
              <option value="pending">💳 En attente</option>
              <option value="refunded">💸 Remboursée</option>
              <option value="cancelled">❌ Annulée</option>
            </select>
            <Button onClick={fetchInvoices} variant="outline" className="gap-2 border-blue-700 text-blue-700 hover:bg-blue-50">
              <RefreshCcw className="h-4 w-4" /> Rafraîchir
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-blue-800">Chargement des factures...</div>
        ) : invoices.length === 0 ? (
          <p className="text-muted-foreground">Aucune facture trouvée.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {invoices.map((invoice) => (
              <Card key={invoice.$id} className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-400" />
                    Facture #{invoice.$id.slice(0, 6)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Montant total : <span className="font-medium text-black">{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Frais de plateforme : {formatCurrency(invoice.platform_fee)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Partenaire : {formatCurrency(invoice.partner_amount)}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    {getStatusBadge(invoice.status)}
                    <span className="text-xs text-gray-500">{formatDate(invoice.created_at)}</span>
                  </div>
                  {invoice.status === "pending" && (
                    <div className="pt-2">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handlePay(invoice)}>
                        Payer maintenant
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}