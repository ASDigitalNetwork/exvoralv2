'use client';

import { createContext, useState, useEffect } from 'react';
import { Language, Translation, translations, DEFAULT_LANGUAGE } from '@/lib/translations';

export interface TranslationContextType {
  language: Language;
  t: Translation;
  setLanguage: (lang: Language) => void;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

export const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('exvoral-language');
      return (saved as Language) || DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });

  const [t, setT] = useState<Translation>(translations[language]);

  const availableLanguages = [
    { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'pt' as Language, name: 'Português', flag: '🇵🇹' },
  ];

  useEffect(() => {
    setT(translations[language]);
    if (typeof window !== 'undefined') {
      localStorage.setItem('exvoral-language', language);
    }
  }, [language]);

  return (
    <TranslationContext.Provider value={{ language, t, setLanguage, availableLanguages }}>
      {children}
    </TranslationContext.Provider>
  );
};
