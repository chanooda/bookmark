import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@repo/ui/components/dialog';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import { useSettingStore } from '../model/settingStore';
import { SettingsDialogContext } from './SettingsDialogContext';
import { SETTINGS_SECTIONS } from './sections';

function SectionIcon({ id, className }: { id: string; className?: string }) {
	const cls = cn('h-[15px] w-[15px] shrink-0', className);

	if (id === 'view-mode') {
		return (
			<svg aria-hidden='true' className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<rect height='7' rx='1.5' strokeWidth='1.5' width='7' x='3' y='3' />
				<rect height='7' rx='1.5' strokeWidth='1.5' width='7' x='14' y='3' />
				<rect height='7' rx='1.5' strokeWidth='1.5' width='7' x='3' y='14' />
				<rect height='7' rx='1.5' strokeWidth='1.5' width='7' x='14' y='14' />
			</svg>
		);
	}

	if (id === 'theme') {
		return (
			<svg aria-hidden='true' className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<circle cx='12' cy='12' r='4' strokeWidth='1.5' />
				<path
					d='M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
					strokeLinecap='round'
					strokeWidth='1.5'
				/>
			</svg>
		);
	}

	if (id === 'realtime-sync') {
		return (
			<svg aria-hidden='true' className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<path
					d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth='1.5'
				/>
			</svg>
		);
	}

	if (id === 'chrome-import') {
		return (
			<svg aria-hidden='true' className={cls} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
				<circle cx='12' cy='12' r='10' strokeWidth='1.5' />
				<circle cx='12' cy='12' r='4' strokeWidth='1.5' />
				<line strokeWidth='1.5' x1='21.17' x2='12' y1='8' y2='8' />
				<line strokeWidth='1.5' x1='3.95' x2='8.54' y1='6.06' y2='14' />
				<line strokeWidth='1.5' x1='10.88' x2='15.46' y1='21.94' y2='14' />
			</svg>
		);
	}

	return null;
}

export function SettingsDialog() {
	const { settingsOpen, setSettingsOpen } = useSettingStore();
	const [isBlocking, setIsBlocking] = useState(false);

	const enabledSections = SETTINGS_SECTIONS.filter((s) => s.enabled);
	const [activeId, setActiveId] = useState(enabledSections[0]?.id ?? '');
	const activeSection = enabledSections.find((s) => s.id === activeId) ?? enabledSections[0];
	const ActiveComponent = activeSection?.component;

	function handleOpenChange(open: boolean) {
		if (!open && !isBlocking) {
			setSettingsOpen(false);
		}
	}

	return (
		<SettingsDialogContext value={{ setBlocking: setIsBlocking }}>
			<Dialog onOpenChange={handleOpenChange} open={settingsOpen}>
				<DialogContent className='w-[min(860px,calc(100vw-2rem))] overflow-hidden p-0 sm:max-w-none [&>button]:top-3 [&>button]:right-3'>
					<DialogTitle className='sr-only'>설정</DialogTitle>
					<DialogDescription className='sr-only'>앱 설정 및 데이터 관리</DialogDescription>

					<div className='flex h-[min(580px,calc(100vh-8rem))]'>
						{/* ── Left sidebar ── */}
						<aside className='flex w-52 shrink-0 flex-col border-r bg-muted/40'>
							<div className='flex h-[52px] items-center border-b border-border/50 px-4'>
								<span className='text-[13px] font-semibold text-foreground/80'>설정</span>
							</div>

							<nav className='flex flex-1 flex-col gap-px overflow-y-auto p-2'>
								{enabledSections.map((section) => (
									<button
										className={cn(
											'flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[13px] transition-colors',
											activeId === section.id
												? 'bg-accent text-accent-foreground font-medium'
												: 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
										)}
										key={section.id}
										onClick={() => setActiveId(section.id)}
										type='button'
									>
										<SectionIcon
											className={
												activeId === section.id
													? 'text-accent-foreground'
													: 'text-muted-foreground/70'
											}
											id={section.id}
										/>
										{section.label}
									</button>
								))}
							</nav>
						</aside>

						{/* ── Right content area ── */}
						<div className='flex min-w-0 flex-1 flex-col'>
							{/* Content header */}
							<div className='flex h-[52px] shrink-0 items-end border-b border-border/50 px-8 pb-3'>
								<div>
									<h2 className='text-[13px] font-semibold text-foreground/90'>
										{activeSection?.label}
									</h2>
									{activeSection?.description && (
										<p className='text-[11px] text-muted-foreground/70'>
											{activeSection.description}
										</p>
									)}
								</div>
							</div>

							{/* Scrollable content */}
							<div className='flex-1 overflow-y-auto px-8 py-6'>
								{ActiveComponent ? <ActiveComponent /> : null}
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</SettingsDialogContext>
	);
}
