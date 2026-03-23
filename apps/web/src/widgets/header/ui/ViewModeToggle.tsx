import { AlignJustify, Grid2x2, LayoutGrid } from 'lucide-react';
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
		icon: <LayoutGrid aria-hidden='true' className='size-4' strokeWidth={1.5} />,
	},
	{
		mode: 'grid',
		title: '그리드 보기',
		icon: <Grid2x2 aria-hidden='true' className='size-4' />,
	},
	{
		mode: 'list',
		title: '목록 보기',
		icon: <AlignJustify aria-hidden='true' className='size-4' />,
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
