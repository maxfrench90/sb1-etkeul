import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';
import { errorMonitor } from '../lib/monitoring';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'ar'],
    defaultNS: 'common',
    ns: ['common', 'auth', 'bookings', 'profile'],
    
    interpolation: {
      escapeValue: false
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },

    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
      skipTranslationOnMissingKey: false
    }
  })
  .catch(error => {
    errorMonitor.logError({
      operation: 'i18n.init',
      error: error instanceof Error ? error.message : 'Failed to initialize i18n',
      severity: 'high',
      timestamp: new Date().toISOString()
    });
  });

// Log language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = i18n.dir(lng);

  errorMonitor.logSuccess({
    operation: 'i18n.languageChange',
    attempts: 1,
    duration: 0,
    context: { language: lng }
  });
});

export default i18n;