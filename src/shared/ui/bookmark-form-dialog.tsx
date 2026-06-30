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

interface BookmarkFormContentProps {
	parentId: string;
	onClose: () => void;
	submitLabel?: string;
	bookmarkId?: string;
	initialTitle?: string;
	initialUrl?: string;
}

export const BookmarkFormContent = ({
	parentId,
	onClose,
	submitLabel = '저장',
	bookmarkId,
	initialTitle = '',
	initialUrl = '',
}: BookmarkFormContentProps) => {
	const isEdit = !!bookmarkId;

	const [title, setTitle] = useState(isEdit ? initialTitle : '');
	const [url, setUrl] = useState(isEdit ? initialUrl : '');

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const onSuccess = () => {
		invalidate();
		onClose();
	};

	const { mutate: createBookmark, isPending: isCreating } = useMutation({
		...mutations.bookmark.createBookmark(),
		onSuccess,
	});

	const { mutate: updateBookmark, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateBookmark(),
		onSuccess,
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedUrl = url.trim();
		if (!trimmedTitle || !trimmedUrl) return;
		if (isEdit && bookmarkId) {
			updateBookmark({ id: bookmarkId, title: trimmedTitle, url: trimmedUrl });
		} else {
			createBookmark({ parentId, title: trimmedTitle, url: trimmedUrl });
		}
	};

	return (
		<form className='flex flex-col gap-3 pt-4' onSubmit={handleSubmit}>
			<Input
				autoFocus
				className='h-12'
				onChange={(e) => setTitle(e.target.value)}
				placeholder='이름'
				value={title}
			/>
			<Input
				className='h-12'
				onChange={(e) => setUrl(e.target.value)}
				placeholder='URL (https://...)'
				type='url'
				value={url}
			/>
			<DialogFooter className='mt-2'>
				<Button onClick={onClose} size='lg' type='button' variant='outline'>
					취소
				</Button>
				<Button disabled={isPending || !title.trim() || !url.trim()} size='lg' type='submit'>
					{submitLabel}
				</Button>
			</DialogFooter>
		</form>
	);
};

interface BookmarkFormDialogProps {
	isOpen: boolean;
	close: () => void;
	unmount: () => void;
	parentId: string;
	bookmarkId: string;
	initialTitle?: string;
	initialUrl?: string;
}

export const BookmarkFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	bookmarkId,
	initialTitle,
	initialUrl,
}: BookmarkFormDialogProps) => {
	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>북마크 수정</DialogTitle>
				</DialogHeader>
				<BookmarkFormContent
					bookmarkId={bookmarkId}
					initialTitle={initialTitle}
					initialUrl={initialUrl}
					onClose={handleClose}
					parentId={parentId}
				/>
			</DialogContent>
		</Dialog>
	);
};
