'use client';

import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import ClientDashboard from '@/components/dashboards/ClientDashboard';
import PartnerDashboard from '@/components/dashboards/PartnerDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { PendingApproval } from '@/components/PendingApproval';
import { useTranslation } from '@/hooks/useTranslation';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'partner' | 'admin';
  isValidated: boolean;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await account.get();
        setIsAuthenticated(true);
        const userId = session.$id;

        const res = await databases.listDocuments('transport_db', 'user_profiles', [
          Query.equal('user_id', [userId]),
        ]);

        if (!res.documents.length) {
          throw new Error(t.errProfileNotFound);
        }

        const profile = res.documents[0];
        const isPartner = profile.role === 'partner';

        setUser({
          id: profile.$id,
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          role: profile.role,
          isValidated: isPartner ? Boolean(profile.is_validated) : true,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération de l’utilisateur :', error);
        window.location.href = '/auth';
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await account.deleteSession('current');
    setUser(null);
    window.location.href = '/auth';
  };

  if (isLoading) {
    return (
      <Layout showSidebar={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            {/* Spinner aux couleurs de la charte */}
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-exv-accent border-t-transparent mx-auto mb-4" aria-label={t.loading} />
            <p className="text-exv-sub">{t.loading}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  if (!user.isValidated) {
    return <PendingApproval userEmail={user.email} onLogout={handleLogout} />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'client':
        return <ClientDashboard />;
      case 'partner':
        return <PartnerDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <ClientDashboard />;
    }
  };

  return <Layout showSidebar={true}>{renderDashboard()}</Layout>;
}
