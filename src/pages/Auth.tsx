import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { PendingApproval } from '@/components/PendingApproval';
import { Navbar } from '@/components/Navbar';
import { useTranslation } from '@/hooks/useTranslation';

// Mock authentication state
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'partner' | 'admin';
  isValidated: boolean;
}

export default function Auth() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Mock authentication - simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock user data - in real app, this would come from your authentication system
    const mockUser: User = {
      id: '1',
      email,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'client',
      isValidated: false, // Set to true to test validated user flow
    };
    
    setUser(mockUser);
    setIsLoading(false);
  };

  const handleSignup = async (data: any) => {
    setIsLoading(true);
    
    // Mock signup - simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock user creation
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isValidated: data.role === 'client' ? true : false,
    };
    
    setUser(newUser);
    setIsLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // If user is logged in but not validated, show pending approval
  if (user && !user.isValidated) {
    return <PendingApproval userEmail={user.email} onLogout={handleLogout} />;
  }

  // If user is validated, redirect to dashboard
  if (user && user.isValidated) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <Navbar />

      <div className="flex items-center justify-center p-4 pt-8">
        {mode === 'login' ? (
          <LoginForm
            onToggleMode={() => setMode('signup')}
          />
        ) : (
          <SignupForm
            onToggleMode={() => setMode('login')}
          />
        )}
      </div>

      {/* Footer */}
      <div className="text-center p-8">
        <p className="text-xs text-muted-foreground">
          © 2024 {t.appName}. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}