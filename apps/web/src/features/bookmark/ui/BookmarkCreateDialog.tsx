import type { CreateBookmarkDto } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { bookmarkKeys, useCreateBookmark } from '@/entities/bookmark';
import { useFolders } from '@/entities/folder';
import { useTags } from '@/entities/tag';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useBookmarkDialogStore, useBookmarkFilterStore } from '../model';
import { useBookmarkForm } from '../model/useBookmarkForm';
import { BookmarkFormFields } from './BookmarkFormFields';

export function BookmarkCreateDialog() {
	const { createOpen, createDefaultFolderId, setCreateOpen } = useBookmarkDialogStore();
	const { selectedFolderId: filterFolderId } = useBookmarkFilterStore();
	const defaultFolderId =
		createDefaultFolderId ?? (filterFolderId !== 'unorganized' ? filterFolderId : undefined);

	const queryClient = useQueryClient();
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);
	const { data: tags = [] } = useTags();
	const { data: folders = [] } = useFolders();
	const { mutate, isPending } = useCreateBookmark();

	const {
		url,
		title,
		selectedTagIds,
		selectedFolderId,
		setSelectedFolderId,
		handleUrlChange,
		handleTitleChange,
		handleTagToggle,
		reset,
	} = useBookmarkForm();

	// Reset when dialog opens
	useEffect(() => {
		if (createOpen) {
			reset({ initialFolderId: defaultFolderId });
		}
	}, [createOpen, defaultFolderId, reset]);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const dto: CreateBookmarkDto = {
			url,
			title,
			description: (data.get('description') as string) || undefined,
			tagIds: selectedTagIds,
			folderId: selectedFolderId,
		};
		mutate(dto, {
			onSuccess: (bookmark) => {
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
				if (chromeSyncService) {
					chromeSyncService
						.syncCreateBookmark(bookmark, folders)
						.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
				}
				setCreateOpen(false);
			},
		});
	}

	return (
		<Dialog onOpenChange={setCreateOpen} open={createOpen}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>북마크 추가</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<BookmarkFormFields
						folderId={selectedFolderId}
						folders={folders}
						onFolderChange={setSelectedFolderId}
						onTagToggle={handleTagToggle}
						onTitleChange={handleTitleChange}
						onUrlChange={handleUrlChange}
						selectedTagIds={selectedTagIds}
						tags={tags}
						title={title}
						url={url}
					/>
					<div className='flex justify-end gap-2 pt-2'>
						<Button onClick={() => setCreateOpen(false)} type='button' variant='outline'>
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
