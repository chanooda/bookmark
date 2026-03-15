import { Label } from '@repo/ui/components/label';
import type { Theme } from '@/shared/lib/theme';
import { useTheme } from '@/shared/lib/theme';

const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
	{ value: 'light', label: '라이트', icon: '☀️' },
	{ value: 'dark', label: '다크', icon: '🌙' },
	{ value: 'system', label: '시스템', icon: '💻' },
];

export function ThemeSection() {
	const { theme, setTheme } = useTheme();

	return (
		<div className='flex flex-col gap-2'>
			<Label>테마</Label>
			<div className='flex gap-2'>
				{THEME_OPTIONS.map((option) => (
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
						{option.label}
					</button>
				))}
			</div>
		</div>
	);
}
