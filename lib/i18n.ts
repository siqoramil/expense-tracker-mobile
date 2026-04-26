import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';

export type Lang = 'en' | 'uz' | 'ru' | 'de' | 'fr' | 'es';

export const LANGUAGES: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'uz', label: 'Uzbek', native: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸' },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: uz },
    ru: { translation: ru },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
    prefix: '{',
    suffix: '}',
  },
  returnNull: false,
});

export const setAppLanguage = (lang: Lang) => {
  if (i18n.language !== lang) i18n.changeLanguage(lang);
};

export function tStr(lang: Lang, key: string, vars?: Record<string, string | number>) {
  return i18n.getFixedT(lang)(key, vars) as string;
}

export type Localized<T = string> = Partial<Record<Lang, T>> & { en: T };

export const pickLocalized = <T>(l: Localized<T> | undefined, lang: Lang, fallback: T): T =>
  l ? (l[lang] ?? l.en ?? fallback) : fallback;

export default i18n;
