import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

interface Invoice {
  $id: string;
  invoice_number: string;
  user_id: string;
  user_name: string;
  amount: number;
  status: "pending" | "paid" | "canceled";
  type: "invoice" | "credit_note";
  description: string;
  created_at: string;
  due_date: string;
  transport_request_id?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments("transport_db", "payments", [
        Query.orderDesc("$createdAt"),
      ]);
      setInvoices(res.documents as Invoice[]);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les factures", variant: "destructive" });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const statusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-600">Payée</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500 text-black">En attente</Badge>;
      case "canceled":
        return <Badge variant="destructive">Annulée</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-900">Liste des factures et avoirs</CardTitle>
            <Button onClick={fetchInvoices} className="mt-4 bg-blue-800 text-white hover:bg-blue-900">Rafraîchir</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Chargement en cours...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Émise le</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Transport</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.$id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.type === "credit_note" ? "Avoir" : "Facture"}</TableCell>
                      <TableCell>{inv.user_name}</TableCell>
                      <TableCell>{inv.description}</TableCell>
                      <TableCell>{inv.amount.toFixed(2)} CHF</TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell>{new Date(inv.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{new Date(inv.due_date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{inv.transport_request_id || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
