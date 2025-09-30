'use client';

import { useEffect, useState } from 'react';
import { databases, account, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Package } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

type TransportRequest = {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number;
  weight: number;
  volume: number;
  package_type?: string;
  description?: string;
  status: string;
  created_at: string;
};

type PartnerOffer = {
  $id: string;
  transport_request_id: string;
  partner_id: string;
  price: number; // ⚠️ Assure-toi que "price" existe dans la collection Appwrite
  message?: string;
  partner_company_name?: string;
  partner_short_id?: number | null;
  status: 'pending' | 'accepted' | 'refused';
  created_at?: string;
};

export default function AvailableRequests() {
  const { t } = useTranslation();

  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [myOffers, setMyOffers] = useState<PartnerOffer[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await account.get();
      setUserId(user.$id);

      const [reqRes, offersRes] = await Promise.all([
        databases.listDocuments('transport_db', 'transports_requests', [
          Query.equal('status', 'pending'),
          Query.orderDesc('$createdAt'),
        ]),
        databases.listDocuments('transport_db', 'partner_offers', [
          Query.equal('partner_id', user.$id),
          Query.orderDesc('$createdAt'),
        ]),
      ]);

      setRequests(reqRes.documents as TransportRequest[]);
      setMyOffers(offersRes.documents as PartnerOffer[]);
    })();
  }, []);

  const refreshData = async () => {
    const [reqRes, offersRes] = await Promise.all([
      databases.listDocuments('transport_db', 'transports_requests', [
        Query.equal('status', 'pending'),
        Query.orderDesc('$createdAt'),
      ]),
      databases.listDocuments('transport_db', 'partner_offers', [
        Query.equal('partner_id', userId),
        Query.orderDesc('$createdAt'),
      ]),
    ]);
    setRequests(reqRes.documents as TransportRequest[]);
    setMyOffers(offersRes.documents as PartnerOffer[]);
  };

  const submitOffer = async () => {
    if (!selectedRequest || !offerPrice) return;

    const price = parseFloat(offerPrice);
    if (Number.isNaN(price) || price <= 0) {
      toast({ title: t.toastErrorTitle, description: t.pricePlaceholder, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const user = await account.get();

      // Récupérer le nom d’entreprise si dispo
      const profRes = await databases.listDocuments('transport_db', 'user_profiles', [
        Query.equal('user_id', user.$id),
        Query.limit(1),
      ]);
      const prof = profRes.documents?.[0] as any | undefined;
      const company =
        prof?.company ||
        prof?.company_name ||
        `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim();

      // ✅ Crée l'offre DANS partner_offers (avec le champ "price" qui doit exister côté Appwrite)
      await databases.createDocument('transport_db', 'partner_offers', ID.unique(), {
        transport_request_id: selectedRequest.$id,
        partner_id: user.$id,
        price, // <-- ce champ doit exister dans ton schéma Appwrite
        message: offerMessage || '',
        partner_company_name: company || '—',
        partner_short_id: prof?.short_id ?? null,
        status: 'pending',
        created_at: new Date().toISOString(),
      } satisfies PartnerOffer);

      await refreshData();

      // Reset & close
      setSelectedRequest(null);
      setOfferPrice('');
      setOfferMessage('');
      setDialogOpen(false);

      toast({ title: t.toastOfferOkTitle, description: t.toastOfferOkDesc });
    } catch (err) {
      console.error(err);
      toast({ title: t.toastErrorTitle, description: t.toastErrorDesc, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const availableWord = requests.length === 1 ? t.availableOne : t.availableMany;

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Eye className="text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.availableRequestsTitle}</h1>
          <Badge className="bg-exv-accent text-exv-primary">
            {requests.length} {availableWord}
          </Badge>
        </div>

        {requests.length === 0 ? (
          <Card className="border-exv-border bg-exv-panel text-exv-text">
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-10 w-10 mb-4 text-exv-accent" />
              <h2 className="text-xl font-medium">{t.emptyTitle}</h2>
              <p className="text-exv-sub">{t.emptySubtitle}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((r) => {
              const myOffer = myOffers.find(
                (o) => o.transport_request_id === r.$id && o.partner_id === userId
              );

              return (
                <Card key={r.$id} className="hover:shadow-lg border-exv-border bg-exv-card text-exv-text">
                  <CardHeader className="pb-2 border-b border-exv-border">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-4 w-4 text-exv-accent" />
                      {t.requestLabel} {r.$id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">{t.departure}</p>
                        <p className="text-exv-sub">{r.pickup_location}</p>

                        <p className="mt-2 font-semibold">{t.arrival}</p>
                        <p className="text-exv-sub">{r.dropoff_location}</p>
                      </div>

                      <div className="space-y-1">
                        <p>
                          {t.weight} <span className="font-medium text-exv-text">{r.weight} kg</span>
                        </p>
                        <p>
                          {t.volume} <span className="font-medium text-exv-text">{r.volume} m³</span>
                        </p>
                        <p>
                          {t.distance}{' '}
                          <span className="font-medium text-exv-text">{r.distance_km} km</span>
                        </p>
                        <p>
                          {t.type}{' '}
                          <span className="font-medium text-exv-text">
                            {r.package_type || t.notSpecified}
                          </span>
                        </p>
                      </div>
                    </div>

                    {r.description && (
                      <div>
                        <p className="font-semibold">{t.description}</p>
                        <p className="text-exv-sub">{r.description}</p>
                      </div>
                    )}

                    {myOffer ? (
                      <p className="text-green-500 font-medium">
                        {t.offerSent} {myOffer.price} €
                      </p>
                    ) : (
                      <>
                        <Button
                          className="bg-exv-accent text-exv-primary hover:opacity-90"
                          onClick={() => {
                            setSelectedRequest(r);
                            setDialogOpen(true);
                          }}
                        >
                          {t.makeOffer}
                        </Button>

                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogContent className="border-exv-border bg-exv-card text-exv-text">
                            <DialogHeader>
                              <DialogTitle>{t.makeOfferTitle}</DialogTitle>
                              {/* A11y: description pour enlever le warning Radix */}
                              <DialogDescription className="sr-only">
                                {t.makeOfferDescription || 'Proposez un prix et un message optionnel pour cette demande.'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">{t.priceProposed}</label>
                                <Input
                                  type="number"
                                  value={offerPrice}
                                  onChange={(e) => setOfferPrice(e.target.value)}
                                  placeholder={t.pricePlaceholder}
                                  className="bg-white text-black"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">{t.messageOptional}</label>
                                <Textarea
                                  value={offerMessage}
                                  onChange={(e) => setOfferMessage(e.target.value)}
                                  rows={3}
                                  placeholder={t.messagePlaceholder}
                                  className="bg-white text-black"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(null);
                                    setDialogOpen(false);
                                  }}
                                  className="border-exv-border text-exv-text hover:bg-exv-panel"
                                >
                                  {t.cancel}
                                </Button>
                                <Button
                                  onClick={submitOffer}
                                  disabled={submitting || !offerPrice}
                                  className="bg-exv-accent text-exv-primary hover:opacity-90"
                                >
                                  {submitting ? t.sending : t.sendOffer}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
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
