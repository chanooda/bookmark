import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@bookmark/ui/components/dialog';
import { cn } from '@bookmark/ui/lib/utils';
import { Chrome, Languages, LayoutGrid, RefreshCw, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingStore } from '../model/settingStore';
import { SettingsDialogContext } from './SettingsDialogContext';
import { SETTINGS_SECTIONS } from './sections';

function SectionIcon({ id, className }: { id: string; className?: string }) {
	const cls = cn('h-[15px] w-[15px] shrink-0', className);

	if (id === 'view-mode') {
		return <LayoutGrid aria-hidden='true' className={cls} strokeWidth={1.5} />;
	}

	if (id === 'theme') {
		return <Sun aria-hidden='true' className={cls} strokeWidth={1.5} />;
	}

	if (id === 'realtime-sync') {
		return <RefreshCw aria-hidden='true' className={cls} strokeWidth={1.5} />;
	}

	if (id === 'chrome-import') {
		return <Chrome aria-hidden='true' className={cls} strokeWidth={1.5} />;
	}

	if (id === 'language') {
		return <Languages aria-hidden='true' className={cls} strokeWidth={1.5} />;
	}

	return null;
}

export function SettingsDialog() {
	const { settingsOpen, setSettingsOpen } = useSettingStore();
	const [isBlocking, setIsBlocking] = useState(false);
	const { t } = useTranslation();

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
					<DialogTitle className='sr-only'>{t('settings.title')}</DialogTitle>
					<DialogDescription className='sr-only'>{t('settings.description')}</DialogDescription>

					<div className='flex h-[min(580px,calc(100vh-8rem))]'>
						{/* ── Left sidebar ── */}
						<aside className='flex w-52 shrink-0 flex-col border-r bg-muted/40'>
							<div className='flex h-[52px] items-center border-b border-border/50 px-4'>
								<span className='text-[13px] font-semibold text-foreground/80'>
									{t('settings.title')}
								</span>
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
										{t(section.labelKey)}
									</button>
								))}
							</nav>
						</aside>

						{/* ── Right content area ── */}
						<div className='flex min-w-0 flex-1 flex-col'>
							{/* Content header */}
							<div className='flex shrink-0 items-end border-b border-border/50 px-8 py-3'>
								<div>
									<h2 className='text-[13px] font-semibold text-foreground/90'>
										{activeSection ? t(activeSection.labelKey) : ''}
									</h2>
									{activeSection?.descriptionKey && (
										<p className='text-[11px] text-muted-foreground/70'>
											{t(activeSection.descriptionKey)}
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
