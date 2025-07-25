"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Euro, Truck, FileText } from "lucide-react";

interface Invoice {
  $id: string;
  partner_id: string;
  transport_id: string;
  amount: number;
  status: string; // paid | pending
  issued_at: string;
}

export default function PartnerInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments("transport_db", "partner_invoices", [
        Query.equal("partner_id", user.$id),
        Query.orderDesc("issued_at"),
      ]);

      setInvoices(res.documents);
      const total = res.documents.reduce((acc, inv) => acc + inv.amount, 0);
      const pending = res.documents
        .filter((inv) => inv.status === "pending")
        .reduce((acc, inv) => acc + inv.amount, 0);

      setTotalAmount(total);
      setPendingAmount(pending);
    } catch (err) {
      console.error("Erreur lors du chargement des factures:", err);
    }
  };

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Truck className="h-5 w-5 text-orange-500" /> Transports facturés
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{invoices.length}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="h-5 w-5 text-orange-500" /> Montant en attente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{pendingAmount.toFixed(2)} €</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Euro className="h-5 w-5 text-orange-500" /> Montant total perçu
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{totalAmount.toFixed(2)} €</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileText className="h-5 w-5 text-orange-500" /> Détail des factures
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.$id}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm flex flex-col md:flex-row justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-blue-800">
                    Transport #{invoice.transport_id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Émise le : {new Date(invoice.issued_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-lg">
                    {invoice.amount.toFixed(2)} €
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      invoice.status === "paid"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    {invoice.status === "paid" ? "Payée" : "En attente"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            className="text-blue-800 font-medium underline hover:text-blue-600"
            onClick={() => navigate("/partner-dashboard")}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </Layout>
  );
}
