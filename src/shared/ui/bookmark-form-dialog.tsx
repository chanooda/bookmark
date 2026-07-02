import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const getFaviconUrl = (url: string): string | null => {
	try {
		const { hostname } = new URL(url);
		return hostname ? `https://favicon.im/${hostname}` : null;
	} catch {
		return null;
	}
};

interface BookmarkFormContentProps {
	bookmarkId?: string;
	initialTitle?: string;
	initialUrl?: string;
	onClose: () => void;
	parentId: string;
	submitLabel?: string;
}

export const BookmarkFormContent = ({
	parentId,
	onClose,
	submitLabel,
	bookmarkId,
	initialTitle = '',
	initialUrl = '',
}: BookmarkFormContentProps) => {
	const { t } = useTranslation();
	const isEdit = !!bookmarkId;

	const [title, setTitle] = useState(isEdit ? initialTitle : '');
	const [url, setUrl] = useState(isEdit ? initialUrl : '');
	const [faviconError, setFaviconError] = useState(false);

	const faviconUrl = getFaviconUrl(url);

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

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		setFaviconError(false);
	};

	return (
		<form className='flex flex-col gap-3 pt-4' onSubmit={handleSubmit}>
			<div className='flex items-center gap-2'>
				<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted'>
					{faviconUrl && !faviconError ? (
						<img
							alt='favicon'
							className='h-6 w-6 object-contain'
							onError={() => setFaviconError(true)}
							src={faviconUrl}
						/>
					) : (
						<Globe className='h-6 w-6 text-muted-foreground' />
					)}
				</div>
				<Input
					autoFocus
					className='h-12'
					onChange={handleUrlChange}
					placeholder={t('bookmarkForm.urlPlaceholder')}
					type='url'
					value={url}
				/>
			</div>
			<Input
				className='h-12'
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t('bookmarkForm.namePlaceholder')}
				value={title}
			/>
			<DialogFooter className='mt-2'>
				<Button onClick={onClose} size='lg' type='button' variant='outline'>
					{t('common.cancel')}
				</Button>
				<Button disabled={isPending || !title.trim() || !url.trim()} size='lg' type='submit'>
					{submitLabel ?? t('common.save')}
				</Button>
			</DialogFooter>
		</form>
	);
};

interface BookmarkFormDialogProps {
	bookmarkId: string;
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
	initialTitle,
	initialUrl,
}: BookmarkFormDialogProps) => {
	const { t } = useTranslation();
	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('bookmarkForm.editTitle')}</DialogTitle>
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
