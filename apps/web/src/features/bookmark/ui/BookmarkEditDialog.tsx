import type { UpdateBookmarkDto } from '@bookmark/types';
import { Button } from '@bookmark/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bookmark/ui/components/dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { bookmarkKeys, useEditBookmark } from '@/entities/bookmark';
import { useFolders } from '@/entities/folder';
import { useTags } from '@/entities/tag';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useBookmarkDialogStore } from '../model';
import { useBookmarkForm } from '../model/useBookmarkForm';
import { BookmarkFormFields } from './BookmarkFormFields';

export function BookmarkEditDialog() {
	const { t } = useTranslation();
	const { editTarget, setEditTarget } = useBookmarkDialogStore();

	const queryClient = useQueryClient();
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);
	const { data: tags = [] } = useTags();
	const { data: folders = [] } = useFolders();
	const { mutate, isPending } = useEditBookmark();

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

	// Sync state when editTarget changes
	useEffect(() => {
		if (editTarget) {
			reset({
				initialUrl: editTarget.url,
				initialTitle: editTarget.title,
				initialTagIds: editTarget.tags.map((t) => t.id),
				initialFolderId: editTarget.folderId ?? undefined,
			});
		}
	}, [editTarget, reset]);

	if (!editTarget) return null;

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!editTarget) return;
		const data = new FormData(e.currentTarget);
		const dto: UpdateBookmarkDto = {
			url,
			title,
			description: (data.get('description') as string) || null,
			tagIds: selectedTagIds,
			folderId: selectedFolderId ?? null,
		};
		mutate(
			{ id: editTarget.id, dto },
			{
				onSuccess: (bookmark) => {
					queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
					if (chromeSyncService) {
						chromeSyncService
							.syncUpdateBookmark(bookmark, folders)
							.catch(() => toast.error(t('bookmark.syncError')));
					}
					setEditTarget(null);
				},
			},
		);
	}

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) setEditTarget(null);
			}}
			open={true}
		>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('bookmark.edit')}</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<BookmarkFormFields
						defaultDescription={editTarget.description ?? ''}
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
						<Button onClick={() => setEditTarget(null)} type='button' variant='outline'>
							{t('common.cancel')}
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? t('bookmark.editing') : t('common.edit')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
