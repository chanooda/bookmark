import { Label } from '@bookmark/ui/components/label';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '@/entities/bookmark';
import { useSettingStore } from '../../model/settingStore';

const VIEW_MODE_OPTIONS: { value: ViewMode; icon: ReactNode; preview: ReactNode }[] = [
	{
		value: 'glass',
		icon: (
			<svg
				aria-hidden='true'
				className='h-4 w-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<rect height='8' rx='2' strokeWidth='1.5' width='8' x='3' y='3' />
				<rect height='8' rx='2' strokeWidth='1.5' width='8' x='13' y='3' />
				<rect height='8' rx='2' strokeWidth='1.5' width='8' x='3' y='13' />
				<rect height='8' rx='2' strokeWidth='1.5' width='8' x='13' y='13' />
			</svg>
		),
		preview: (
			<svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
				<rect
					fill='currentColor'
					fillOpacity='0.13'
					height='20'
					rx='3'
					stroke='currentColor'
					strokeOpacity='0.25'
					strokeWidth='0.7'
					width='35'
					x='3'
					y='3'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.13'
					height='20'
					rx='3'
					stroke='currentColor'
					strokeOpacity='0.25'
					strokeWidth='0.7'
					width='35'
					x='42'
					y='3'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.08'
					height='20'
					rx='3'
					stroke='currentColor'
					strokeOpacity='0.18'
					strokeWidth='0.7'
					width='35'
					x='3'
					y='26'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.08'
					height='20'
					rx='3'
					stroke='currentColor'
					strokeOpacity='0.18'
					strokeWidth='0.7'
					width='35'
					x='42'
					y='26'
				/>
				<rect fill='currentColor' fillOpacity='0.35' height='5' rx='1.5' width='5' x='8' y='8' />
				<rect
					fill='currentColor'
					fillOpacity='0.28'
					height='1.5'
					rx='0.75'
					width='14'
					x='16'
					y='9'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.18'
					height='1.5'
					rx='0.75'
					width='10'
					x='16'
					y='12'
				/>
				<rect fill='currentColor' fillOpacity='0.35' height='5' rx='1.5' width='5' x='47' y='8' />
				<rect
					fill='currentColor'
					fillOpacity='0.28'
					height='1.5'
					rx='0.75'
					width='14'
					x='55'
					y='9'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.18'
					height='1.5'
					rx='0.75'
					width='10'
					x='55'
					y='12'
				/>
			</svg>
		),
	},
	{
		value: 'grid',
		icon: (
			<svg
				aria-hidden='true'
				className='h-4 w-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<rect height='7' rx='1' strokeWidth='1.5' width='7' x='3' y='3' />
				<rect height='7' rx='1' strokeWidth='1.5' width='7' x='14' y='3' />
				<rect height='7' rx='1' strokeWidth='1.5' width='7' x='3' y='14' />
				<rect height='7' rx='1' strokeWidth='1.5' width='7' x='14' y='14' />
			</svg>
		),
		preview: (
			<svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
				{[0, 1, 2].map((col) =>
					[0, 1].map((row) => (
						<rect
							fill='currentColor'
							fillOpacity={row === 0 ? 0.11 : 0.07}
							height='20'
							key={`${col}-${row}`}
							rx='2.5'
							stroke='currentColor'
							strokeOpacity='0.2'
							strokeWidth='0.7'
							width='21'
							x={3 + col * 26}
							y={3 + row * 24}
						/>
					)),
				)}
				<rect fill='currentColor' fillOpacity='0.3' height='4' rx='1' width='4' x='7' y='7' />
				<rect
					fill='currentColor'
					fillOpacity='0.25'
					height='1.5'
					rx='0.75'
					width='11'
					x='13'
					y='8'
				/>
				<rect
					fill='currentColor'
					fillOpacity='0.15'
					height='1.5'
					rx='0.75'
					width='8'
					x='13'
					y='11'
				/>
			</svg>
		),
	},
	{
		value: 'list',
		icon: (
			<svg
				aria-hidden='true'
				className='h-4 w-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='6' y2='6' />
				<line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='12' y2='12' />
				<line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='18' y2='18' />
			</svg>
		),
		preview: (
			<svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<g key={i}>
						<rect
							fill='currentColor'
							fillOpacity={Math.max(0.04, 0.11 - i * 0.013)}
							height='6'
							rx='1.5'
							width='72'
							x='4'
							y={3 + i * 8}
						/>
						<rect
							fill='currentColor'
							fillOpacity='0.35'
							height='3'
							rx='0.75'
							width='3'
							x='7'
							y={4.5 + i * 8}
						/>
						<rect
							fill='currentColor'
							fillOpacity='0.25'
							height='1.5'
							rx='0.75'
							width='22'
							x='13'
							y={5.25 + i * 8}
						/>
						<rect
							fill='currentColor'
							fillOpacity='0.12'
							height='1.5'
							rx='0.75'
							width='14'
							x='52'
							y={5.25 + i * 8}
						/>
					</g>
				))}
			</svg>
		),
	},
];

export function ViewModeSection() {
	const { viewMode, setViewMode } = useSettingStore();
	const { t } = useTranslation();

	return (
		<div className='flex flex-col gap-2'>
			<Label>{t('viewMode.label')}</Label>
			<div className='flex gap-2'>
				{VIEW_MODE_OPTIONS.map((option) => (
					<button
						className={`flex flex-1 flex-col items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-2 text-xs transition-all ${
							viewMode === option.value
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
						}`}
						key={option.value}
						onClick={() => setViewMode(option.value)}
						type='button'
					>
						<div
							className={`w-full overflow-hidden rounded transition-opacity ${
								viewMode === option.value ? 'opacity-80' : 'opacity-50'
							}`}
						>
							{option.preview}
						</div>
						<div className='flex items-center gap-1'>
							{option.icon}
							{t(`viewMode.${option.value}`)}
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
