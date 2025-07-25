'use client';

import { useEffect, useState } from 'react';
import { Menu, X, Truck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface NavbarProps {
  isAuthenticated?: boolean;
  userFirstName?: string;
  onLogout?: () => void;
}

export const Navbar = ({ isAuthenticated = false, userFirstName, onLogout }: NavbarProps) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Chargement script Google Translate
  useEffect(() => {
    if (!(window as any).googleTranslateElementInit) {
      (window as any).googleTranslateElementInit = function () {
        new (window as any).google.translate.TranslateElement(
          {
            pageLanguage: 'fr',
            includedLanguages: 'fr,en,pt',
            layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          'google_translate_element'
        );
      };

      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <nav className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 shadow-lg sticky top-0 z-50 rounded-b-3xl border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-yellow-400 p-2 rounded-2xl shadow">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-bold">Exvoral Transport</h1>
              <p className="text-xs text-white/70 hidden sm:block">{t.appSlogan}</p>
            </div>
          </div>

          {/* Right content (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Google Translate */}
            <div id="google_translate_element" className="google-translate-custom" />


            {isAuthenticated && (
              <>
                <p className="text-sm text-white">
                  {t.hello}, <span className="font-semibold">{userFirstName}</span>
                </p>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile: Google Translate + Burger */}
          <div className="md:hidden flex items-center gap-2">
            <div id="google_translate_element" className="scale-[0.85] origin-top-left" />
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-white">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-blue-800 bg-blue-700 px-4 py-4 space-y-3">
          {isAuthenticated && (
            <div className="flex items-center justify-between text-white">
              <p>
                {t.hello}, <span className="font-semibold">{userFirstName}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white hover:text-red-500 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t.logout}
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
