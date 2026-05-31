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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/shadcn/components/ui/tabs';

interface ItemFormDialogProps {
	isOpen: boolean;
	close: () => void;
	unmount: () => void;
	parentId: string;
	defaultTab?: 'bookmark' | 'folder';
	bookmarkId?: string;
	initialUrl?: string;
	folderId?: string;
	initialTitle?: string;
}

export const ItemFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	defaultTab = 'bookmark',
	bookmarkId,
	initialUrl = '',
	folderId,
	initialTitle = '',
}: ItemFormDialogProps) => {
	const isBookmarkEdit = !!bookmarkId;
	const isFolderEdit = !!folderId;
	const isEdit = isBookmarkEdit || isFolderEdit;

	const [tab, setTab] = useState<'bookmark' | 'folder'>(defaultTab);
	const [bookmarkTitle, setBookmarkTitle] = useState(isBookmarkEdit ? initialTitle : '');
	const [bookmarkUrl, setBookmarkUrl] = useState(isBookmarkEdit ? initialUrl : '');
	const [folderTitle, setFolderTitle] = useState(isFolderEdit ? initialTitle : '');

	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const onSuccess = () => {
		invalidate();
		close();
		unmount();
	};

	const { mutate: createBookmark, isPending: isCreatingBookmark } = useMutation({
		...mutations.bookmark.createBookmark(),
		onSuccess,
	});

	const { mutate: updateBookmark, isPending: isUpdatingBookmark } = useMutation({
		...mutations.bookmark.updateBookmark(),
		onSuccess,
	});

	const { mutate: createFolder, isPending: isCreatingFolder } = useMutation({
		...mutations.bookmark.createFolder(),
		onSuccess,
	});

	const { mutate: updateFolder, isPending: isUpdatingFolder } = useMutation({
		...mutations.bookmark.updateFolder(),
		onSuccess,
	});

	const isPending = isCreatingBookmark || isUpdatingBookmark || isCreatingFolder || isUpdatingFolder;

	const handleClose = () => {
		close();
		unmount();
	};

	const handleBookmarkSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = bookmarkTitle.trim();
		const trimmedUrl = bookmarkUrl.trim();
		if (!trimmedTitle || !trimmedUrl) return;
		if (isBookmarkEdit && bookmarkId) {
			updateBookmark({ id: bookmarkId, title: trimmedTitle, url: trimmedUrl });
		} else {
			createBookmark({ parentId, title: trimmedTitle, url: trimmedUrl });
		}
	};

	const handleFolderSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = folderTitle.trim();
		if (!trimmed) return;
		if (isFolderEdit && folderId) {
			updateFolder({ id: folderId, title: trimmed });
		} else {
			createFolder({ parentId, title: trimmed });
		}
	};

	const dialogTitle = isBookmarkEdit
		? '북마크 수정'
		: isFolderEdit
			? '폴더 이름 수정'
			: tab === 'bookmark'
				? '새 북마크 추가'
				: '새 폴더 만들기';

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
				</DialogHeader>

				{isEdit ? (
					isBookmarkEdit ? (
						<form className='flex flex-col gap-3' onSubmit={handleBookmarkSubmit}>
							<Input
								autoFocus
								className='h-12'
								onChange={(e) => setBookmarkTitle(e.target.value)}
								placeholder='이름'
								value={bookmarkTitle}
							/>
							<Input
								className='h-12'
								onChange={(e) => setBookmarkUrl(e.target.value)}
								placeholder='URL (https://...)'
								type='url'
								value={bookmarkUrl}
							/>
							<DialogFooter className='mt-2'>
								<Button onClick={handleClose} size='lg' type='button' variant='outline'>
									취소
								</Button>
								<Button
									disabled={isPending || !bookmarkTitle.trim() || !bookmarkUrl.trim()}
									size='lg'
									type='submit'
								>
									저장
								</Button>
							</DialogFooter>
						</form>
					) : (
						<form onSubmit={handleFolderSubmit}>
							<Input
								autoFocus
								className='mt-1'
								onChange={(e) => setFolderTitle(e.target.value)}
								placeholder='폴더 이름'
								value={folderTitle}
							/>
							<DialogFooter className='mt-4'>
								<Button onClick={handleClose} type='button' variant='outline'>
									취소
								</Button>
								<Button disabled={isPending || !folderTitle.trim()} type='submit'>
									저장
								</Button>
							</DialogFooter>
						</form>
					)
				) : (
					<Tabs onValueChange={(v) => setTab(v as 'bookmark' | 'folder')} value={tab}>
						<TabsList className='w-full'>
							<TabsTrigger className='flex-1' value='bookmark'>
								북마크
							</TabsTrigger>
							<TabsTrigger className='flex-1' value='folder'>
								폴더
							</TabsTrigger>
						</TabsList>
						<TabsContent value='bookmark'>
							<form className='flex flex-col gap-3 pt-4' onSubmit={handleBookmarkSubmit}>
								<Input
									autoFocus
									className='h-12'
									onChange={(e) => setBookmarkTitle(e.target.value)}
									placeholder='이름'
									value={bookmarkTitle}
								/>
								<Input
									className='h-12'
									onChange={(e) => setBookmarkUrl(e.target.value)}
									placeholder='URL (https://...)'
									type='url'
									value={bookmarkUrl}
								/>
								<DialogFooter className='mt-2'>
									<Button onClick={handleClose} size='lg' type='button' variant='outline'>
										취소
									</Button>
									<Button
										disabled={isPending || !bookmarkTitle.trim() || !bookmarkUrl.trim()}
										size='lg'
										type='submit'
									>
										추가
									</Button>
								</DialogFooter>
							</form>
						</TabsContent>
						<TabsContent value='folder'>
							<form className='pt-4' onSubmit={handleFolderSubmit}>
								<Input
									className='mt-1'
									onChange={(e) => setFolderTitle(e.target.value)}
									placeholder='폴더 이름'
									value={folderTitle}
								/>
								<DialogFooter className='mt-4'>
									<Button onClick={handleClose} type='button' variant='outline'>
										취소
									</Button>
									<Button disabled={isPending || !folderTitle.trim()} type='submit'>
										만들기
									</Button>
								</DialogFooter>
							</form>
						</TabsContent>
					</Tabs>
				)}
			</DialogContent>
		</Dialog>
	);
};
