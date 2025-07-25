export const useTranslation = () => {
  return {
    t: (key: string) => key, // Ne traduit rien, retourne juste la clé
    language: 'fr',
    setLanguage: (_lang: string) => {},
  };
};