import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Package, Camera, Upload, Truck } from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TransportRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  package_type: string;
  created_at: string;
}

interface TrackingUpdate {
  id: string;
  status: string;
  location_name: string;
  notes: string;
  photos: string[];
  created_at: string;
}

export default function PartnerTracking() {
  const { id } = useParams();
  const [transport, setTransport] = useState<TransportRequest | null>(null);
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchTransportAndUpdates();
    }
  }, [id]);

  const fetchTransportAndUpdates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transport details
      const { data: transportData, error: transportError } = await supabase
        .from('transport_requests')
        .select(`
          *,
          offers!inner(partner_id)
        `)
        .eq('id', id)
        .eq('offers.partner_id', user.id)
        .single();

      if (transportError) throw transportError;
      setTransport(transportData);

      // Fetch tracking updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('tracking_updates')
        .select('*')
        .eq('transport_request_id', id)
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (updatesError) throw updatesError;
      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement du suivi:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('tracking-photos')
        .upload(fileName, photo);

      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('tracking-photos')
        .getPublicUrl(fileName);
      
      uploadedUrls.push(publicUrl);
    }
    
    return uploadedUrls;
  };

  const addTrackingUpdate = async () => {
    if (!newStatus || !transport) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Upload photos if any
      const photoUrls = photos.length > 0 ? await uploadPhotos() : [];

      const { error } = await supabase
        .from('tracking_updates')
        .insert({
          transport_request_id: transport.id,
          partner_id: user.id,
          status: newStatus,
          location_name: locationName,
          notes: notes,
          photos: photoUrls,
          latitude: null, // Could be added with geolocation
          longitude: null,
        });

      if (error) throw error;

      // Reset form
      setNewStatus('');
      setLocationName('');
      setNotes('');
      setPhotos([]);

      // Refresh updates
      await fetchTransportAndUpdates();

      toast({
        title: "Mise à jour ajoutée",
        description: "La mise à jour du suivi a été envoyée au client.",
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la mise à jour.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos(prev => [...prev, ...files].slice(0, 5)); // Max 5 photos
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Gestion du Suivi</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Transport non trouvé</h1>
        <p className="text-muted-foreground">Ce transport n'existe pas ou vous n'avez pas les permissions pour le gérer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Gestion du Suivi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Transport #{transport.id.slice(0, 8)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Départ</p>
                  <p className="text-sm text-muted-foreground">{transport.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Arrivée</p>
                  <p className="text-sm text-muted-foreground">{transport.destination_address}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="text-sm font-medium">{transport.package_type || 'Non spécifié'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <Badge>{transport.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une mise à jour</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Enlèvement</SelectItem>
                  <SelectItem value="in_transit">En transit</SelectItem>
                  <SelectItem value="delivered">Livré</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Localisation</label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Nom du lieu (optionnel)"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires, état du colis..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photos</label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Ajouter des photos
              </Button>
              <span className="text-sm text-muted-foreground">
                {photos.length}/5 photos
              </span>
            </div>
            
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={addTrackingUpdate} disabled={submitting || !newStatus} className="w-full">
            {submitting ? 'Envoi...' : 'Envoyer la mise à jour'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des mises à jour</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune mise à jour ajoutée pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {updates.map((update, index) => (
                <div key={update.id} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{update.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(update.created_at).toLocaleString()}
                    </span>
                  </div>
                  {update.location_name && (
                    <p className="text-sm text-muted-foreground mb-1">
                      📍 {update.location_name}
                    </p>
                  )}
                  {update.notes && (
                    <p className="text-sm mb-2">{update.notes}</p>
                  )}
                  {update.photos && update.photos.length > 0 && (
                    <div className="flex gap-2">
                      {update.photos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Camera className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}