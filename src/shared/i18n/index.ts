import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zhCN from './locales/zh-CN.json';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh-CN'] as const;

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			ko: { translation: ko },
			en: { translation: en },
			ja: { translation: ja },
			'zh-CN': { translation: zhCN },
		},
		fallbackLng: 'en',
		supportedLngs: SUPPORTED_LANGUAGES,
		nonExplicitSupportedLngs: false,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
			lookupLocalStorage: 'i18nextLng',
		},
	});

export default i18n;
