import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface FolderFormContentProps {
	folderId?: string;
	initialTitle?: string;
	onClose: () => void;
	parentId: string;
	submitLabel?: string;
}

export const FolderFormContent = ({
	parentId,
	onClose,
	submitLabel,
	folderId,
	initialTitle = '',
}: FolderFormContentProps) => {
	const { t } = useTranslation();
	const isEdit = !!folderId;

	const [title, setTitle] = useState(isEdit ? initialTitle : '');

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const onSuccess = () => {
		invalidate();
		onClose();
	};

	const { mutate: createFolder, isPending: isCreating } = useMutation({
		...mutations.bookmark.createFolder(),
		onSuccess,
	});

	const { mutate: updateFolder, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateFolder(),
		onSuccess,
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		if (isEdit && folderId) {
			updateFolder({ id: folderId, title: trimmed });
		} else {
			createFolder({ parentId, title: trimmed });
		}
	};

	return (
		<form className='pt-4' onSubmit={handleSubmit}>
			<Input
				autoFocus={!isEdit}
				className='mt-1'
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t('folderForm.namePlaceholder')}
				value={title}
			/>
			<DialogFooter className='mt-4'>
				<Button onClick={onClose} type='button' variant='outline'>
					{t('common.cancel')}
				</Button>
				<Button disabled={isPending || !title.trim()} type='submit'>
					{submitLabel ?? t('common.save')}
				</Button>
			</DialogFooter>
		</form>
	);
};

interface FolderFormDialogProps {
	close: () => void;
	folderId: string;
	initialTitle?: string;
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const FolderFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	folderId,
	initialTitle,
}: FolderFormDialogProps) => {
	const { t } = useTranslation();
	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('folderForm.editTitle')}</DialogTitle>
				</DialogHeader>
				<FolderFormContent
					folderId={folderId}
					initialTitle={initialTitle}
					onClose={handleClose}
					parentId={parentId}
				/>
			</DialogContent>
		</Dialog>
	);
};
