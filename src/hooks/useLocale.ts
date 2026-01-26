import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { changeUILanguage, getCurrentUILanguage, getLanguageFamily } from '@/locales';

export type UILanguage = 'pt-BR' | 'en';

export function useLocale() {
  const { t, i18n } = useTranslation();

  const currentLanguage = getCurrentUILanguage();
  const languageFamily = getLanguageFamily();

  const setLanguage = useCallback((lang: UILanguage) => {
    changeUILanguage(lang);
  }, []);

  const isPortuguese = languageFamily === 'pt';
  const isEnglish = languageFamily === 'en';

  // Format currency based on region
  const formatCurrency = useCallback((amount: number, forceRegion?: 'br' | 'eu') => {
    const region = forceRegion || (isPortuguese ? 'br' : 'eu');
    
    if (region === 'br') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }, [isPortuguese]);

  // Format date based on region (DD/MM/YYYY for both)
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }, [currentLanguage]);

  // Format time
  const formatTime = useCallback((date: Date) => {
    return new Intl.DateTimeFormat(currentLanguage, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, [currentLanguage]);

  return {
    t,
    i18n,
    currentLanguage,
    languageFamily,
    setLanguage,
    isPortuguese,
    isEnglish,
    formatCurrency,
    formatDate,
    formatTime,
  };
}
