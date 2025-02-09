import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { errorMonitor } from '../lib/monitoring';

export function useI18n(namespace?: string) {
  const { t, i18n, ready } = useTranslation(namespace);

  useEffect(() => {
    if (!ready) {
      errorMonitor.logError({
        operation: 'i18n.loading',
        error: 'Translations not ready',
        severity: 'medium',
        timestamp: new Date().toISOString(),
        context: {
          namespace,
          currentLanguage: i18n.language
        }
      });
    }
  }, [ready, namespace, i18n.language]);

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  };

  const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
  };

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency
    }).format(value);
  };

  return {
    t,
    i18n,
    ready,
    formatNumber,
    formatDate,
    formatCurrency,
    isRTL: i18n.dir() === 'rtl'
  };
}