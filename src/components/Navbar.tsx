'use client';

import { useState } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n as useTranslation } from '@/context/TranslationContext';

interface NavbarProps {
  isAuthenticated?: boolean;
  userFirstName?: string;
  onLogout?: () => void;
}

const LANGS: Array<{ code: 'fr' | 'en' | 'pt'; label: string }> = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'pt', label: 'PT' },
];

export const Navbar = ({
  isAuthenticated = false,
  userFirstName,
  onLogout,
}: NavbarProps) => {
  const { t, lang, setLang } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((s) => !s);

  return (
    <nav className="sticky top-0 z-50 rounded-b-3xl border-b"
         style={{ background: 'linear-gradient(135deg, #0B161C 0%, #344B5D 60%, #0B161C 100%)', borderColor: '#5E778B' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <img
              src="/exvoral-white.svg"
              alt="Exvoral"
              className="h-20 w-auto select-none"
            />
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-2xl px-1 py-1"
                 style={{ backgroundColor: 'rgba(94,119,139,0.15)', border: '1px solid rgba(94,119,139,0.35)' }}>
              {LANGS.map(({ code, label }) => {
                const active = lang === code;
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`px-2.5 py-1 text-sm rounded-xl transition
                      ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                    aria-pressed={active}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {isAuthenticated && (
              <>
                <p className="text-sm text-white/80">
                  {t.hello},{' '}
                  <span className="font-semibold text-white">{userFirstName}</span>
                </p>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggles */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-xl text-white/90 hover:bg-white/10 transition"
              aria-label="Open menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-3"
             style={{ backgroundColor: 'rgba(11,22,28,0.85)', borderTop: '1px solid #5E778B' }}>
          {/* Language switcher (mobile) */}
          <div className="flex items-center gap-2">
            {LANGS.map(({ code, label }) => {
              const active = lang === code;
              return (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 rounded-xl text-sm transition
                    ${active ? 'bg-white/10 text-white' : 'text-white/75 hover:text-white hover:bg-white/5'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {isAuthenticated && (
            <div className="flex items-center justify-between text-white">
              <p className="text-sm">
                {t.hello},{' '}
                <span className="font-semibold">{userFirstName}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-white/80 hover:text-white hover:bg-white/10 flex items-center gap-2"
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
