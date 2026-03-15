import type { Folder } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { folderKeys, useFolders } from '@/entities/folder';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useCreateFolder } from '../api/useCreateFolder';
import { useFolderDialogStore } from '../model/folderDialogStore';

export function FolderCreateDialog() {
	const { createOpen, createParentId, setCreateOpen } = useFolderDialogStore();
	const queryClient = useQueryClient();
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);
	const { mutate: createFolder, isPending } = useCreateFolder();
	const { data: folders = [] } = useFolders();
	const [name, setName] = useState('');

	const parentFolder: Folder | null =
		createParentId && createParentId !== 'root'
			? (folders.find((f) => f.id === createParentId) ?? null)
			: null;

	useEffect(() => {
		if (createOpen) setName('');
	}, [createOpen]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		createFolder(
			{
				name: name.trim(),
				parentId: createParentId === 'root' ? undefined : (createParentId ?? undefined),
			},
			{
				onSuccess: (newFolder) => {
					const existingFolders = queryClient.getQueryData<Folder[]>(folderKeys.all) ?? [];
					queryClient.invalidateQueries({ queryKey: folderKeys.all });
					if (chromeSyncService) {
						chromeSyncService
							.syncCreateFolder(newFolder, [...existingFolders, newFolder])
							.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
					}
					setCreateOpen(false);
				},
			},
		);
	}

	return (
		<Dialog onOpenChange={(open) => !isPending && setCreateOpen(open)} open={createOpen}>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>새 폴더</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					{parentFolder && (
						<div className='flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground'>
							<svg
								aria-hidden='true'
								className='h-3 w-3 shrink-0'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
							<span className='font-medium text-foreground/70'>{parentFolder.name}</span>
							<span>안에 생성됩니다</span>
						</div>
					)}
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='folder-name'>이름 *</Label>
						<Input
							autoFocus
							id='folder-name'
							onChange={(e) => setName(e.target.value)}
							placeholder='폴더 이름'
							required
							value={name}
						/>
					</div>
					<div className='flex justify-end gap-2 pt-1'>
						<Button
							disabled={isPending}
							onClick={() => setCreateOpen(false)}
							type='button'
							variant='outline'
						>
							취소
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? '추가 중...' : '추가'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
