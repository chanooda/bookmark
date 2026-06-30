import { useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/shadcn/components/ui/tabs';
import { BookmarkFormContent } from './bookmark-form-dialog';
import { FolderFormContent } from './folder-form-dialog';

interface ItemFormDialogProps {
	close: () => void;
	defaultTab?: 'bookmark' | 'folder';
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const ItemFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	defaultTab = 'bookmark',
}: ItemFormDialogProps) => {
	const [tab, setTab] = useState<'bookmark' | 'folder'>(defaultTab);

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{tab === 'bookmark' ? '새 북마크 추가' : '새 폴더 만들기'}</DialogTitle>
				</DialogHeader>
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
						<BookmarkFormContent onClose={handleClose} parentId={parentId} submitLabel='추가' />
					</TabsContent>
					<TabsContent value='folder'>
						<FolderFormContent onClose={handleClose} parentId={parentId} submitLabel='만들기' />
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
