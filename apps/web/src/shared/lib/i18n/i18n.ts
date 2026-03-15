import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en/translation.json';
import ja from '@/locales/ja/translation.json';
import ko from '@/locales/ko/translation.json';
import zh from '@/locales/zh/translation.json';

export const SUPPORTED_LANGUAGES = ['en', 'ko', 'zh', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: en },
			ko: { translation: ko },
			zh: { translation: zh },
			ja: { translation: ja },
		},
		fallbackLng: 'en',
		supportedLngs: SUPPORTED_LANGUAGES,
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
			lookupLocalStorage: 'i18n_language',
		},
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
