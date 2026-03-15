import type { SyncMode } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import { useSettingStore } from '../../model/settingStore';

interface SyncOption {
	value: SyncMode;
	label: string;
	description: string;
	warning?: string;
}

const SYNC_OPTIONS: SyncOption[] = [
	{
		value: 'off',
		label: '동기화 안 함',
		description: 'Chrome 북마크와 앱 간 자동 동기화를 사용하지 않습니다.',
	},
	{
		value: 'chrome-to-web',
		label: 'Chrome → Web',
		description: 'Chrome 북마크 변경 시 앱에 자동 반영됩니다.',
		warning: '⚠ Chrome에서 북마크 삭제 시 앱에서도 영구 삭제됩니다.',
	},
	{
		value: 'web-to-chrome',
		label: 'Web → Chrome',
		description: '앱에서 북마크 변경 시 Chrome 북마크에 자동 반영됩니다.',
		warning: '⚠ 앱에서 북마크 삭제 시 Chrome에서도 영구 삭제됩니다.',
	},
	{
		value: 'bidirectional',
		label: '양방향',
		description: '앱과 Chrome 북마크가 양방향으로 자동 동기화됩니다.',
		warning: '⚠ 어느 쪽에서 삭제해도 양쪽에서 영구 삭제됩니다.',
	},
];

export function RealtimeSyncSection() {
	const { syncMode, setSyncMode } = useSettingStore();
	const [localSyncMode, setLocalSyncMode] = useState<SyncMode>(syncMode);
	const isDirty = localSyncMode !== syncMode;

	function handleSave() {
		setSyncMode(localSyncMode);
	}

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>실시간 동기화</span>
				<Button disabled={!isDirty} onClick={handleSave} size='sm'>
					저장
				</Button>
			</div>
			<div className='rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400'>
				⚠ 동기화 설정에 따라 크롬 북마크가 삭제될 수 있습니다. 사전에 크롬 북마크를 내보내기(
				<span className='font-medium'>Chrome 설정 → 북마크 및 목록 → 북마크 내보내기</span>
				)하는 것을 권장합니다.
			</div>
			<div className='flex flex-col gap-2'>
				{SYNC_OPTIONS.map((option) => (
					<button
						className={cn(
							'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
							localSyncMode === option.value
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:border-primary/50',
						)}
						key={option.value}
						onClick={() => setLocalSyncMode(option.value)}
						type='button'
					>
						<span className='text-sm font-medium'>{option.label}</span>
						<span className='text-xs'>{option.description}</span>
						{option.warning && localSyncMode === option.value && (
							<span className='mt-0.5 text-xs text-destructive'>{option.warning}</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
}
