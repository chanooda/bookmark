import { useTranslation } from 'react-i18next';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/shadcn/components/ui/select';

const LANGUAGE_OPTIONS = [
	{ code: 'ko', label: '한국어' },
	{ code: 'en', label: 'English' },
	{ code: 'ja', label: '日本語' },
	{ code: 'zh-CN', label: '中文' },
] as const;

interface SettingsDialogProps {
	close: () => void;
	isOpen: boolean;
	unmount: () => void;
}

export const SettingsDialog = ({ isOpen, close, unmount }: SettingsDialogProps) => {
	const { t, i18n } = useTranslation();

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('settings.title')}</DialogTitle>
				</DialogHeader>
				<div className='flex items-center justify-between py-2'>
					<span className='text-sm'>{t('settings.language')}</span>
					<Select
						onValueChange={(value) => i18n.changeLanguage(value)}
						value={i18n.resolvedLanguage}
					>
						<SelectTrigger className='w-36'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_OPTIONS.map((option) => (
								<SelectItem key={option.code} value={option.code}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</DialogContent>
		</Dialog>
	);
};
