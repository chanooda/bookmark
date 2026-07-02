import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();
	const [tab, setTab] = useState<'bookmark' | 'folder'>(defaultTab);

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>
						{tab === 'bookmark' ? t('itemForm.addBookmarkTitle') : t('itemForm.addFolderTitle')}
					</DialogTitle>
				</DialogHeader>
				<Tabs onValueChange={(v) => setTab(v as 'bookmark' | 'folder')} value={tab}>
					<TabsList className='w-full'>
						<TabsTrigger className='flex-1' value='bookmark'>
							{t('common.bookmark')}
						</TabsTrigger>
						<TabsTrigger className='flex-1' value='folder'>
							{t('common.folder')}
						</TabsTrigger>
					</TabsList>
					<TabsContent value='bookmark'>
						<BookmarkFormContent
							onClose={handleClose}
							parentId={parentId}
							submitLabel={t('common.add')}
						/>
					</TabsContent>
					<TabsContent value='folder'>
						<FolderFormContent
							onClose={handleClose}
							parentId={parentId}
							submitLabel={t('itemForm.createFolderSubmit')}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
