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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { account, databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useTranslation } from '@/hooks/useTranslation';

interface UserInfo {
  first_name: string;
  last_name: string;
  role: string;
}

const roleLabel = (role: string, t: Record<string, string>) => {
  if (role === 'client') return t.roleClientLabel;
  if (role === 'partner') return t.rolePartnerLabel;
  if (role === 'admin') return t.roleAdminLabel;
  return role;
};

const getMenuItems = (role: string, t: Record<string, string>) => {
  const commonItems = [
    { title: t.sidebarDashboard, url: '/dashboard', icon: Home },
    { title: t.sidebarProfile, url: '/profile', icon: User },
  ];
  const clientItems = [
    { title: t.sidebarNewRequest, url: '/new-request', icon: Package2 },
    { title: t.sidebarMyRequests, url: '/client/requests', icon: List },
    { title: t.sidebarMyTracking, url: '/tracking', icon: MapPin },
    { title: t.sidebarMyInvoices, url: '/invoices', icon: CreditCard },
  ];
  const partnerItems = [
    { title: t.sidebarAvailableRequests, url: '/available-requests', icon: Eye },
    { title: t.sidebarPartnerTransports, url: '/partner-transports', icon: Truck },
    { title: t.sidebarPartnerTracking, url: '/partner-tracking/[id]', icon: MapPin },
    { title: t.sidebarPartnerInvoices, url: '/partner-invoices', icon: CreditCard },
  ];
  const adminItems = [
    { title: t.sidebarAdminUsers, url: '/admin/users', icon: UserCog },
    { title: t.sidebarAdminRequests, url: '/admin/requests', icon: FileText },
    { title: t.sidebarAdminInvoices, url: '/admin/invoices', icon: CreditCard },
    { title: t.sidebarAdminAnalytics, url: '/admin/analytics', icon: BarChart3 },
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
  const { t } = useTranslation();

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

  const menuItems = useMemo(() => getMenuItems(userInfo?.role || '', t), [userInfo?.role, t]);

  return (
    <aside
      className={cn(
        'flex flex-col justify-between h-[90vh] shadow-xl transition-all duration-300',
        collapsed ? 'w-20 px-2' : 'w-64 px-4',
        'py-6 rounded-3xl m-4',
        'bg-exv-panel border border-exv-border text-exv-text'
      )}
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-r from-exv-accent to-exv-dark">
              <Truck className="h-6 w-6" color="#0B161C" />
            </div>
            {!collapsed && userInfo && (
              <div className="text-exv-text">
                <h2 className="text-base font-bold leading-tight">Exvoral Transport</h2>
                <span className="text-xs bg-exv-card px-2 py-1 rounded-full border border-exv-border capitalize">
                  {roleLabel(userInfo.role, t)}
                </span>
                <div className="text-xs mt-1 text-exv-sub">
                  {t.hello}, {userInfo.first_name} {userInfo.last_name}
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-exv-text hover:text-exv-accent"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              to={item.url}
              key={item.url}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-exv-accent text-exv-primary shadow-inner'
                    : 'text-exv-sub hover:bg-exv-card hover:text-exv-text'
                )
              }
            >
              <item.icon className={cn('h-5 w-5', 'text-current')} />
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
          className="flex w-full items-center gap-3 text-exv-text hover:text-red-500 hover:bg-red-500/10 rounded-xl py-2 px-4 transition-all"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Settings className="h-5 w-5" />}
          {!collapsed && <span>{loading ? t.loggingOut : t.logout}</span>}
        </Button>
      </div>
    </aside>
  );
}
