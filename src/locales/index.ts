import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './pt-BR.json';
import en from './en.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'pt': { translation: ptBR },
  'en': { translation: en },
  'en-US': { translation: en },
  'en-GB': { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['pt-BR', 'pt', 'en', 'en-US', 'en-GB'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'ui_language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

// Helper to get language family (pt or en)
export const getLanguageFamily = (): 'pt' | 'en' => {
  const lang = i18n.language;
  if (lang.startsWith('pt')) return 'pt';
  return 'en';
};

// Helper to change UI language
export const changeUILanguage = (lang: 'pt-BR' | 'en') => {
  i18n.changeLanguage(lang);
  localStorage.setItem('ui_language', lang);
};

// Get current UI language
export const getCurrentUILanguage = (): 'pt-BR' | 'en' => {
  const lang = i18n.language;
  if (lang.startsWith('pt')) return 'pt-BR';
  return 'en';
};

export default i18n;
