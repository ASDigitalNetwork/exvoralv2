import { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showNavbar?: boolean;
  user?: {
    firstName: string;
    role: 'client' | 'partner' | 'admin';
    isValidated?: boolean;
  };
  onLogout?: () => void;
}

export const Layout = ({
  children,
  showSidebar = false,
  showNavbar = true,
  user,
  onLogout,
}: LayoutProps) => {
  const isAuthenticated = !!user;

  if (showSidebar) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar userRole={user?.role || 'client'} />
          <div className="flex-1 flex flex-col">
            {showNavbar && (
              <Navbar
                isAuthenticated={isAuthenticated}
                userFirstName={user?.firstName}
                onLogout={onLogout}
              />
            )}
            <main className="flex-1 p-6 bg-gradient-to-br from-background via-primary/5 to-accent/5">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {showNavbar && (
        <Navbar
          isAuthenticated={isAuthenticated}
          userFirstName={user?.firstName}
          onLogout={onLogout}
        />
      )}
      <main className={showNavbar ? 'pt-0' : ''}>
        {children}
      </main>
    </div>
  );
};
