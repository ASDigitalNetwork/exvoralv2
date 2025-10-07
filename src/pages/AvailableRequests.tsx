'use client';

import { useEffect, useMemo, useState } from 'react';
import { databases, account, ID } from '@/lib/appwrite';
import { Query, Permission, Role } from 'appwrite';
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

type RequestStatus = 'pending' | 'validated' | 'in_progress' | 'delivered' | 'canceled';

type TransportRequest = {
  $id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: number;
  weight: number;
  volume: number;
  package_type?: string;
  description?: string;
  status: RequestStatus;
  created_at: string;
};

type OfferStatus = 'pending' | 'accepted' | 'rejected';

type PartnerOffer = {
  $id: string;
  transport_request_id: string;
  partner_id: string;
  price: number; // <-- ce champ doit exister dans la collection Appwrite
  message?: string;
  partner_company_name?: string;
  partner_short_id?: number | null;
  status: OfferStatus;
  created_at?: string;
  $createdAt?: string;
};

const DB_ID = 'transport_db';
const COL_REQUESTS = 'transports_requests';
const COL_OFFERS = 'partner_offers';

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

  // ─────────────────────────────────────────────────────────────
  // Règle de suppression d’une offre par le partenaire
  // (à réutiliser dans ta page “Mes offres”)
  // On autorise la suppression de l’offre si la demande est:
  //  - VALIDÉE / EN COURS / LIVRÉE (donc attribuée à un partenaire, peu importe lequel)
  //  - CANCELED (refusée au client par l’admin)
  // Sinon, l’offre reste, même si elle est “rejected”, tant que la demande est encore “pending”.
  // ─────────────────────────────────────────────────────────────
  const canDeleteOfferForRequest = (reqStatus: RequestStatus) => {
    return reqStatus === 'validated' || reqStatus === 'in_progress' || reqStatus === 'delivered' || reqStatus === 'canceled';
  };

  // Appel à utiliser sur ta page “Mes offres”
  const deleteOfferIfAllowed = async (offer: PartnerOffer, relatedRequest: TransportRequest) => {
    if (!canDeleteOfferForRequest(relatedRequest.status)) {
      toast({
        title: t.toastErrorTitle,
        description: t.cannotDeleteOffer ?? 'Suppression non autorisée tant que la demande est encore en attente.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await databases.deleteDocument(DB_ID, COL_OFFERS, offer.$id);
      toast({ title: t.deleted ?? 'Supprimé', description: t.offerDeleted ?? "L'offre a été supprimée." });
      // rafraîchis ensuite ta liste “Mes offres” là où tu appelleras cette fonction
    } catch (err) {
      console.error(err);
      toast({ title: t.toastErrorTitle, description: t.toastErrorDesc, variant: 'destructive' });
    }
  };

  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      const user = await account.get();
      setUserId(user.$id);

      const [reqRes, offersRes] = await Promise.all([
        databases.listDocuments(DB_ID, COL_REQUESTS, [
          Query.equal('status', 'pending'),
          Query.orderDesc('$createdAt'),
        ]),
        databases.listDocuments(DB_ID, COL_OFFERS, [
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
      databases.listDocuments(DB_ID, COL_REQUESTS, [
        Query.equal('status', 'pending'),
        Query.orderDesc('$createdAt'),
      ]),
      databases.listDocuments(DB_ID, COL_OFFERS, [
        Query.equal('partner_id', userId),
        Query.orderDesc('$createdAt'),
      ]),
    ]);
    setRequests(reqRes.documents as TransportRequest[]);
    setMyOffers(offersRes.documents as PartnerOffer[]);
  };

  // 🔒 Après qu’un partenaire a proposé une offre (peu importe son statut),
  // la demande NE DOIT PLUS apparaître dans la liste.
  const visibleRequests = useMemo(() => {
    if (!myOffers.length) return requests;
    const offeredRequestIds = new Set(myOffers.map((o) => o.transport_request_id));
    return requests.filter((r) => !offeredRequestIds.has(r.$id));
  }, [requests, myOffers]);

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

      // Récupérer infos du profil pour le nom d’entreprise
      const profRes = await databases.listDocuments(DB_ID, 'user_profiles', [
        Query.equal('user_id', user.$id),
        Query.limit(1),
      ]);
      const prof = profRes.documents?.[0] as any | undefined;
      const company =
        prof?.company ||
        prof?.company_name ||
        `${prof?.first_name ?? ''} ${prof?.last_name ?? ''}`.trim();

      // ✅ Créer l’offre avec permissions (auteur + admins)
      await databases.createDocument(
        DB_ID,
        COL_OFFERS,
        ID.unique(),
        {
          transport_request_id: selectedRequest.$id,
          partner_id: user.$id,
          price,
          message: offerMessage || '',
          partner_company_name: company || '—',
          partner_short_id: prof?.short_id ?? null,
          status: 'pending' as OfferStatus,
          created_at: new Date().toISOString(),
        } satisfies PartnerOffer,
        [
          // droits du partenaire (auteur)
          Permission.read(Role.user(user.$id)),
          Permission.update(Role.user(user.$id)),
          Permission.delete(Role.user(user.$id)),
          // droits de l’équipe admins
          Permission.read(Role.team('admins')),
          Permission.update(Role.team('admins')),
          Permission.delete(Role.team('admins')),
        ]
      );

      // Rafraîchir (la demande va disparaître de la liste)
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

  const availableWord = visibleRequests.length === 1 ? t.availableOne : t.availableMany;

  return (
    <Layout showSidebar>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Eye className="text-exv-accent" />
          <h1 className="text-2xl font-bold text-exv-text">{t.availableRequestsTitle}</h1>
          <Badge className="bg-exv-accent text-exv-primary">
            {visibleRequests.length} {availableWord}
          </Badge>
        </div>

        {visibleRequests.length === 0 ? (
          <Card className="border-exv-border bg-exv-panel text-exv-text">
            <CardContent className="text-center py-12">
              <Package className="mx-auto h-10 w-10 mb-4 text-exv-accent" />
              <h2 className="text-xl font-medium">{t.emptyTitle}</h2>
              <p className="text-exv-sub">{t.emptySubtitle}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {visibleRequests.map((r) => (
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
                          {t.makeOfferDescription ||
                            'Proposez un prix et un message optionnel pour cette demande.'}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
