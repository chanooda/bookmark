import { Label } from '@bookmark/ui/components/label';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@/shared/lib/theme';
import { useTheme } from '@/shared/lib/theme';

const THEME_VALUES: { value: Theme; icon: string }[] = [
	{ value: 'light', icon: '☀️' },
	{ value: 'dark', icon: '🌙' },
	{ value: 'system', icon: '💻' },
];

export function ThemeSection() {
	const { theme, setTheme } = useTheme();
	const { t } = useTranslation();

	return (
		<div className='flex flex-col gap-2'>
			<Label>{t('theme.label')}</Label>
			<div className='flex gap-2'>
				{THEME_VALUES.map((option) => (
					<button
						className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
							theme === option.value
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
						}`}
						key={option.value}
						onClick={() => setTheme(option.value)}
						type='button'
					>
						<span aria-hidden='true'>{option.icon}</span>
						{t(`theme.${option.value}`)}
					</button>
				))}
			</div>
		</div>
	);
}
