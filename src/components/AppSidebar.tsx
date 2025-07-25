'use client';

import {
  Home,
  Package2,
  FileText,
  Users,
  Settings,
  User,
  Truck,
  CreditCard,
  BarChart3,
  UserCog,
  MapPin,
  Eye,
  List,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface UserInfo {
  first_name: string;
  last_name: string;
  role: string;
}

const getMenuItems = (role: string) => {
  const commonItems = [
    { title: 'Tableau de bord', url: '/dashboard', icon: Home },
    { title: 'Mon profil', url: '/profile', icon: User },
  ];
  const clientItems = [
    { title: 'Nouvelle demande', url: '/new-request', icon: Package2 },
    { title: 'Mes demandes', url: '/client/requests', icon: List },
    { title: 'Mes transports', url: '/tracking', icon: MapPin },
    { title: 'Mes factures', url: '/invoices', icon: CreditCard },
  ];
  const partnerItems = [
    { title: 'Demandes disponibles', url: '/available-requests', icon: Eye },
    { title: 'Mes transports', url: '/partner-transports', icon: Truck },
    { title: 'Suivi partenaire', url: '/partner-tracking/[id]', icon: MapPin },
    { title: 'Mes factures', url: '/partner-invoices', icon: CreditCard },
  ];
  const adminItems = [
    { title: 'Gestion utilisateurs', url: '/admin/users', icon: UserCog },
    { title: 'Toutes les demandes', url: '/admin/requests', icon: FileText },
    { title: 'Toutes les factures', url: '/admin/invoices', icon: CreditCard },
    { title: 'Analyses', url: '/admin/analytics', icon: BarChart3 },
  ];

  if (role === 'client') return [...commonItems, ...clientItems];
  if (role === 'partner') return [...commonItems, ...partnerItems];
  if (role === 'admin') return [...commonItems, ...adminItems];
  return commonItems;
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const navigate = useNavigate();

  const fetchUserInfo = async () => {
    try {
      const user = await account.get();
      const res = await databases.listDocuments('transport_db', 'user_profiles', [
        Query.equal('user_id', user.$id),
        Query.limit(1),
      ]);
      const profile = res.documents[0];
      setUserInfo({
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
      });
    } catch (error) {
      console.error('Erreur chargement utilisateur :', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await account.deleteSession('current');
      navigate('/auth');
    } catch (err) {
      console.error('Erreur déconnexion :', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = getMenuItems(userInfo?.role || '');

  return (
    <aside
      className={cn(
        'flex flex-col justify-between h-[90vh] shadow-xl transition-all duration-300',
        collapsed ? 'w-20 px-2' : 'w-64 px-4',
        'py-6 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 rounded-3xl m-4'
      )}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-yellow-400 p-2 rounded-2xl shadow">
              <Truck className="h-6 w-6 text-white" />
            </div>
            {!collapsed && userInfo && (
              <div className="text-white">
                <h2 className="text-base font-bold leading-tight">Exvoral</h2>
                <span className="text-xs bg-white/10 px-2 py-1 rounded-full capitalize">
                  {userInfo.role}
                </span>
                <div className="text-xs mt-1">
                  Bonjour, {userInfo.first_name} {userInfo.last_name}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:text-orange-400"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              to={item.url}
              key={item.title}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium',
                  isActive
                    ? 'bg-orange-400 text-white shadow-inner'
                    : 'text-white hover:bg-blue-600/40 hover:text-white'
                )
              }
            >
              <item.icon className="h-5 w-5 text-white" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="px-2 mt-6">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="flex w-full items-center gap-3 text-white hover:text-red-500 hover:bg-red-500/10 rounded-xl py-2 px-4 transition-all"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Settings className="h-5 w-5" />
          )}
          {!collapsed && <span>{loading ? 'Déconnexion...' : 'Déconnexion'}</span>}
        </Button>
      </div>
    </aside>
  );
}
