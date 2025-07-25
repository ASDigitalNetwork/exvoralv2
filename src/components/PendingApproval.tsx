import { Clock, AlertCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface PendingApprovalProps {
  userEmail: string;
  onLogout: () => void;
}

export const PendingApproval = ({ userEmail, onLogout }: PendingApprovalProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md card-gradient animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl font-bold">{t.pendingApproval}</CardTitle>
          <CardDescription className="text-base">
            {t.accountNotValidated}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Votre compte est en cours de validation</p>
                <p className="text-xs text-muted-foreground">
                  Un administrateur doit approuver votre compte avant que vous puissiez accéder à la plateforme.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-accent mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Compte: {userEmail}</p>
                <p className="text-xs text-muted-foreground">
                  {t.contactAdmin}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Nous traiterons votre demande dans les plus brefs délais. Vous recevrez un e-mail de confirmation une fois votre compte validé.
            </p>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={onLogout}
            >
              {t.logout}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};