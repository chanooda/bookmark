import type { CreateBookmarkDto } from '@bookmark/types';
import { Button } from '@bookmark/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bookmark/ui/components/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();
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
						.catch(() => toast.error(t('bookmark.syncError')));
				}
				setCreateOpen(false);
			},
		});
	}

	return (
		<Dialog onOpenChange={setCreateOpen} open={createOpen}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('bookmark.add')}</DialogTitle>
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
							{t('common.cancel')}
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? t('bookmark.adding') : t('common.add')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
