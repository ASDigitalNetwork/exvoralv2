import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/useTranslation';

// Configuration manuelle avec drapeaux
const languageMap = {
  fr: { name: 'Français', flag: '🇫🇷' },
  en: { name: 'English', flag: '🇬🇧' },
  pt: { name: 'Português', flag: '🇵🇹' },
};

export const LanguageSelector = () => {
  const { language, setLanguage } = useTranslation();


  const handleChange = (code: string) => {
    setLanguage(code); // mise à jour du hook
    localStorage.setItem('lang', code); // persistance
    window.location.reload(); // recharge toute l'app pour appliquer la langue
  };

  const currentLang = languageMap[language];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-orange-500/10">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag}</span>
          <span className="hidden md:inline">{currentLang?.name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[180px] bg-zinc-800 text-white border-zinc-700">
        {Object.entries(languageMap).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleChange(code)}
            className={`flex items-center gap-3 cursor-pointer rounded-md px-2 py-2 transition-all ${
              language === code ? 'bg-orange-100/10 text-orange-400 font-semibold' : 'hover:bg-zinc-700'
            }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
