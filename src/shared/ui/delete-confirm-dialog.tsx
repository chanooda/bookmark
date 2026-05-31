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
					<AlertDialogCancel onClick={handleCancel}>취소</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} variant='destructive'>
						삭제
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
