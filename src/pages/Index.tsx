import { ArrowRight, CheckCircle, Truck, Users, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useTranslation } from '@/hooks/useTranslation';

const Index = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Transport Professionnel',
      description: 'Réseau de partenaires transporteurs qualifiés et vérifiés pour tous vos besoins.'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Plateforme Sécurisée',
      description: 'Validation manuelle des utilisateurs et paiements sécurisés pour votre tranquillité.'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Suivi Complet',
      description: 'Suivez vos demandes en temps réel depuis la création jusqu\'à la livraison.'
    }
  ];

  const handleGetStarted = () => {
    window.location.href = '/auth';
  };

  const handleLogin = () => {
    window.location.href = '/auth';
  };

  return (
    <Layout showNavbar={true}>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Plateforme de transport de confiance
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gradient mb-6 leading-tight">
                {t.appName}
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                {t.appSlogan}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="xl" 
                className="gap-2 min-w-[200px]" 
                onClick={handleGetStarted}
              >
                Commencer maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="min-w-[200px]"
                onClick={handleLogin}
              >
                Se connecter
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Validation manuelle des utilisateurs
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Paiements sécurisés
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Support client 24/7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Pourquoi choisir <span className="text-gradient">Exvoral Transports</span> ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète qui simplifie la gestion de vos transports professionnels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-gradient hover-lift text-center">
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gradient">{t.appName}</h3>
                <p className="text-sm text-muted-foreground">Transport professionnel</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 {t.appName}. {t.allRightsReserved}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;