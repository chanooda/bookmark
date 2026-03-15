import type { SyncMode } from '@bookmark/types';
import { Button } from '@bookmark/ui/components/button';
import { cn } from '@bookmark/ui/lib/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingStore } from '../../model/settingStore';

const SYNC_OPTION_VALUES: { value: SyncMode; key: string }[] = [
	{ value: 'off', key: 'off' },
	{ value: 'chrome-to-web', key: 'chromeToWeb' },
	{ value: 'web-to-chrome', key: 'webToChrome' },
	{ value: 'bidirectional', key: 'bidirectional' },
];

export function RealtimeSyncSection() {
	const { syncMode, setSyncMode } = useSettingStore();
	const [localSyncMode, setLocalSyncMode] = useState<SyncMode>(syncMode);
	const isDirty = localSyncMode !== syncMode;
	const { t } = useTranslation();

	function handleSave() {
		setSyncMode(localSyncMode);
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>{t('sync.label')}</span>
				<Button disabled={!isDirty} onClick={handleSave} size='sm'>
					{t('sync.save')}
				</Button>
			</div>
			<div className='rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400'>
				{t('sync.warning', { path: t('sync.warningPath') })}
			</div>
			<div className='flex flex-col gap-2'>
				{SYNC_OPTION_VALUES.map(({ value, key }) => (
					<button
						className={cn(
							'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
							localSyncMode === value
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-primary/50',
						)}
						key={value}
						onClick={() => setLocalSyncMode(value)}
						type='button'
					>
						<span className='text-sm font-medium'>{t(`sync.options.${key}.label`)}</span>
						<span className='text-xs'>{t(`sync.options.${key}.description`)}</span>
						{localSyncMode === value && t(`sync.options.${key}.warning`) && (
							<span className='mt-0.5 text-xs text-destructive'>
								{t(`sync.options.${key}.warning`)}
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
}
