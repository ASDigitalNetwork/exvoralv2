import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, Package, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TransportRequest {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  package_type: string;
  package_weight: number;
  distance_km: number;
  final_price: number;
  created_at: string;
}

export default function MyTransports() {
  const [transports, setTransports] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTransports();
  }, []);

  const fetchMyTransports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transport_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransports(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "En attente", variant: "secondary" as const },
      quoted: { label: "Devisé", variant: "outline" as const },
      accepted: { label: "Accepté", variant: "default" as const },
      in_progress: { label: "En cours", variant: "default" as const },
      delivered: { label: "Livré", variant: "default" as const },
      cancelled: { label: "Annulé", variant: "destructive" as const },
    };
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Mes Transports</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Mes Transports</h1>
        </div>
        <Button onClick={() => navigate('/new-request')}>
          Nouveau transport
        </Button>
      </div>

      {transports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun transport</h3>
            <p className="text-muted-foreground text-center">
              Vous n'avez pas encore de demandes de transport.
            </p>
            <Button onClick={() => navigate('/new-request')} className="mt-4">
              Créer ma première demande
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transports.map((transport) => {
            const statusInfo = getStatusBadge(transport.status);
            return (
              <Card key={transport.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Transport #{transport.id.slice(0, 8)}
                    </CardTitle>
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Départ</p>
                          <p className="text-sm text-muted-foreground">
                            {transport.pickup_address}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Arrivée</p>
                          <p className="text-sm text-muted-foreground">
                            {transport.destination_address}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm font-medium">{transport.package_type || 'Non spécifié'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Poids:</span>
                        <span className="text-sm font-medium">{transport.package_weight || 0} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Distance:</span>
                        <span className="text-sm font-medium">{transport.distance_km || 0} km</span>
                      </div>
                      {transport.final_price && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Prix:</span>
                          <span className="text-sm font-bold text-primary">{transport.final_price}€</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Créé le {new Date(transport.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      {(transport.status === 'in_progress' || transport.status === 'delivered') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/tracking/${transport.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Suivre
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/transport/${transport.id}`)}
                      >
                        Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}