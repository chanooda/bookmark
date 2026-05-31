import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { mutations, queries } from '@/shared/api';
import { Button } from '@/shared/shadcn/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { Input } from '@/shared/shadcn/components/ui/input';

interface BookmarkFormDialogProps {
	bookmarkId?: string;
	close: () => void;
	initialTitle?: string;
	initialUrl?: string;
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const BookmarkFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	bookmarkId,
	initialTitle = '',
	initialUrl = '',
}: BookmarkFormDialogProps) => {
	const isEdit = !!bookmarkId;
	const [title, setTitle] = useState(initialTitle);
	const [url, setUrl] = useState(initialUrl);
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: create, isPending: isCreating } = useMutation({
		...mutations.bookmark.createBookmark(),
		onSuccess() {
			invalidate();
			close();
			unmount();
		},
	});

	const { mutate: update, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateBookmark(),
		onSuccess() {
			invalidate();
			close();
			unmount();
		},
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedUrl = url.trim();
		if (!trimmedTitle || !trimmedUrl) return;
		if (isEdit && bookmarkId) {
			update({ id: bookmarkId, title: trimmedTitle, url: trimmedUrl });
		} else {
			create({ parentId, title: trimmedTitle, url: trimmedUrl });
		}
	};

	const handleClose = () => {
		close();
		unmount();
	};

	const isValid = title.trim() && url.trim();

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{isEdit ? '북마크 수정' : '새 북마크 추가'}</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-2' onSubmit={handleSubmit}>
					<Input
						autoFocus
						onChange={(e) => setTitle(e.target.value)}
						placeholder='이름'
						value={title}
					/>
					<Input
						onChange={(e) => setUrl(e.target.value)}
						placeholder='URL (https://...)'
						type='url'
						value={url}
					/>
					<DialogFooter className='mt-2'>
						<Button onClick={handleClose} type='button' variant='outline'>
							취소
						</Button>
						<Button disabled={isPending || !isValid} type='submit'>
							{isEdit ? '저장' : '추가'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
