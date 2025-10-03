import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation dictionaries
import translationEN from './locales/en.json';
import translationRU from './locales/ru.json';
import translationZH from './locales/zh.json';
import translationUK from './locales/uk.json';
import translationES from './locales/es.json';
import translationKO from './locales/ko.json';
import translationTR from './locales/tr.json';
import translationHI from './locales/hi.json';

// Translation resources
const resources = {
  en: {
    translation: translationEN,
  },
  ru: {
    translation: translationRU,
  },
  zh: {
    translation: translationZH,
  },
  uk: {
    translation: translationUK,
  },
  es: {
    translation: translationES,
  },
  ko: {
    translation: translationKO,
  },
  tr: {
    translation: translationTR,
  },
  hi: {
    translation: translationHI,
  },
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch(() => {});

// Additional protection: prevent automatic language switching
if (typeof window !== 'undefined') {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage) {
    // If user has already chosen a language, stick to it
    i18n.changeLanguage(savedLanguage);
  }
}

export default i18n;
