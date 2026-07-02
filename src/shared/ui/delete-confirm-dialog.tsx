import { useTranslation } from 'react-i18next';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/shared/shadcn/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
	close: () => void;
	description: string;
	isOpen: boolean;
	onConfirm: () => void;
	title: string;
	unmount: () => void;
}

export const DeleteConfirmDialog = ({
	isOpen,
	close,
	unmount,
	title,
	description,
	onConfirm,
}: DeleteConfirmDialogProps) => {
	const { t } = useTranslation();

	const handleConfirm = () => {
		onConfirm();
		close();
		unmount();
	};

	const handleCancel = () => {
		close();
		unmount();
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && handleCancel()} open={isOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>{t('common.cancel')}</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} variant='destructive'>
						{t('common.delete')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
