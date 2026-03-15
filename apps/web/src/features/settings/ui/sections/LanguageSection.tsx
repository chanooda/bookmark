import { Label } from '@bookmark/ui/components/label';
import { cn } from '@bookmark/ui/lib/utils';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/shared/lib/i18n';

export function LanguageSection() {
	const { t, i18n } = useTranslation();
	const currentLang = i18n.language as SupportedLanguage;

	function handleChange(lang: SupportedLanguage) {
		i18n.changeLanguage(lang);
	}

	return (
		<div className='flex flex-col gap-2'>
			<Label>{t('language.label')}</Label>
			<div className='flex flex-col gap-1.5'>
				{SUPPORTED_LANGUAGES.map((lang) => (
					<button
						className={cn(
							'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
							currentLang === lang
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground',
						)}
						key={lang}
						onClick={() => handleChange(lang)}
						type='button'
					>
						<span className='font-medium'>{t(`language.languages.${lang}`)}</span>
					</button>
				))}
			</div>
		</div>
	);
}
