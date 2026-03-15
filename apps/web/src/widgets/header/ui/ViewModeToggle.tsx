import type { ViewMode } from '@/entities/bookmark';

interface ViewModeToggleProps {
	viewMode: ViewMode;
	onViewModeChange: (mode: ViewMode) => void;
}

const VIEW_MODE_BUTTONS: {
	mode: ViewMode;
	title: string;
	icon: React.ReactNode;
}[] = [
	{
		mode: 'glass',
		title: '글래스 보기',
		icon: (
			<svg
				aria-hidden='true'
				className='size-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<rect height='9' rx='2' strokeWidth='1.5' width='9' x='2' y='2' />
				<rect height='9' rx='2' strokeWidth='1.5' width='9' x='13' y='2' />
				<rect height='9' rx='2' strokeWidth='1.5' width='9' x='2' y='13' />
				<rect height='9' rx='2' strokeWidth='1.5' width='9' x='13' y='13' />
			</svg>
		),
	},
	{
		mode: 'grid',
		title: '그리드 보기',
		icon: (
			<svg
				aria-hidden='true'
				className='size-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<path
					d='M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
				/>
			</svg>
		),
	},
	{
		mode: 'list',
		title: '목록 보기',
		icon: (
			<svg
				aria-hidden='true'
				className='size-4'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<path
					d='M4 6h16M4 12h16M4 18h16'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
				/>
			</svg>
		),
	},
];

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
	const activeClass = 'bg-background text-foreground shadow-sm';
	const inactiveClass = 'text-muted-foreground hover:text-foreground';

	return (
		<div className='mr-0.5 flex items-center gap-0.5 rounded-lg bg-muted/70 p-0.5'>
			{VIEW_MODE_BUTTONS.map(({ mode, title, icon }) => (
				<button
					className={`rounded-md p-2 transition-all ${viewMode === mode ? activeClass : inactiveClass}`}
					key={mode}
					onClick={() => onViewModeChange(mode)}
					title={title}
					type='button'
				>
					{icon}
				</button>
			))}
		</div>
	);
}
