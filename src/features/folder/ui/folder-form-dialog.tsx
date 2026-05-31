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

interface FolderFormDialogProps {
	close: () => void;
	folderId?: string;
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
	initialTitle = '',
}: FolderFormDialogProps) => {
	const isEdit = !!folderId;
	const [title, setTitle] = useState(initialTitle);
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: create, isPending: isCreating } = useMutation({
		...mutations.bookmark.createFolder(),
		onSuccess() {
			invalidate();
			close();
			unmount();
		},
	});

	const { mutate: update, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateFolder(),
		onSuccess() {
			invalidate();
			close();
			unmount();
		},
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		if (isEdit && folderId) {
			update({ id: folderId, title: trimmed });
		} else {
			create({ parentId, title: trimmed });
		}
	};

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{isEdit ? '폴더 이름 수정' : '새 폴더 만들기'}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<Input
						autoFocus
						className='mt-1'
						onChange={(e) => setTitle(e.target.value)}
						placeholder='폴더 이름'
						value={title}
					/>
					<DialogFooter className='mt-4'>
						<Button onClick={handleClose} type='button' variant='outline'>
							취소
						</Button>
						<Button disabled={isPending || !title.trim()} type='submit'>
							{isEdit ? '저장' : '만들기'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
