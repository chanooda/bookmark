import { Button } from '@repo/ui/components/button';
import { useEffect } from 'react';
import { useSettingStore } from '../../model/settingStore';
import { useChromeBookmarkImport } from '../../model/useChromeBookmarkImport';
import { useSettingsDialogContext } from '../SettingsDialogContext';

export function ChromeImportSection() {
	const { importChromeBookmarks, progress, reset, isChromeBookmarksAvailable } =
		useChromeBookmarkImport();
	const { setBlocking } = useSettingsDialogContext();
	const { settingsOpen } = useSettingStore();

	useEffect(() => {
		setBlocking(progress.status === 'importing');
	}, [progress.status, setBlocking]);

	useEffect(() => {
		if (!settingsOpen) reset();
	}, [settingsOpen, reset]);

	if (!isChromeBookmarksAvailable) return null;

	const isImporting = progress.status === 'importing';
	const isDone = progress.status === 'done';
	const isError = progress.status === 'error';
	const progressPercent =
		progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

	return (
		<div className='flex flex-col gap-3'>
			<div>
				<h3 className='text-sm font-medium'>Chrome 북마크 가져오기</h3>
				<p className='mt-0.5 text-xs text-muted-foreground'>
					현재 Chrome 브라우저의 북마크를 앱으로 가져옵니다. 이미 있는 URL은 건너뜁니다.
				</p>
			</div>

			{(isImporting || isDone) && progress.total > 0 && (
				<div className='flex flex-col gap-1.5'>
					<div className='h-2 overflow-hidden rounded-full bg-secondary'>
						<div
							className='h-full rounded-full bg-primary transition-all duration-300'
							style={{ width: `${progressPercent}%` }}
						/>
					</div>
					<p className='text-xs text-muted-foreground'>
						{isDone
							? `완료 — ${progress.total}개 중 ${progress.current}개 처리됨`
							: `${progress.current} / ${progress.total} 처리 중...`}
					</p>
				</div>
			)}

			{isError && (
				<p className='text-xs text-destructive'>오류: {progress.error ?? '알 수 없는 오류'}</p>
			)}

			<Button
				className='w-full gap-2'
				disabled={isImporting}
				onClick={importChromeBookmarks}
				variant={isDone ? 'outline' : 'default'}
			>
				<svg
					aria-hidden='true'
					className='h-4 w-4'
					fill='none'
					stroke='currentColor'
					viewBox='0 0 24 24'
				>
					<circle cx='12' cy='12' r='10' strokeWidth={2} />
					<circle cx='12' cy='12' r='4' strokeWidth={2} />
					<line strokeWidth={2} x1='21.17' x2='12' y1='8' y2='8' />
					<line strokeWidth={2} x1='3.95' x2='8.54' y1='6.06' y2='14' />
					<line strokeWidth={2} x1='10.88' x2='15.46' y1='21.94' y2='14' />
				</svg>
				{isImporting
					? `가져오는 중... (${progressPercent}%)`
					: isDone
						? '다시 가져오기'
						: 'Chrome 북마크 가져오기'}
			</Button>
		</div>
	);
}
