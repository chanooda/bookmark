import { Button } from '@bookmark/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bookmark/ui/components/dialog';
import { Input } from '@bookmark/ui/components/input';
import { Label } from '@bookmark/ui/components/label';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditFolder } from '../api/useEditFolder';
import { useFolderDialogStore } from '../model/folderDialogStore';

export function FolderEditDialog() {
	const { t } = useTranslation();
	const { editTarget, setEditTarget } = useFolderDialogStore();
	const { mutate: editFolder, isPending } = useEditFolder();
	const [name, setName] = useState('');

	useEffect(() => {
		if (editTarget) setName(editTarget.name);
	}, [editTarget]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!editTarget || !name.trim()) return;
		editFolder(
			{ id: editTarget.id, dto: { name: name.trim() } },
			{ onSuccess: () => setEditTarget(null) },
		);
	}

	return (
		<Dialog
			onOpenChange={(open) => !isPending && !open && setEditTarget(null)}
			open={editTarget !== null}
		>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>{t('folder.rename')}</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='folder-edit-name'>{t('folder.name')} *</Label>
						<Input
							autoFocus
							id='folder-edit-name'
							onChange={(e) => setName(e.target.value)}
							placeholder={t('folder.namePlaceholder')}
							required
							value={name}
						/>
					</div>
					<div className='flex justify-end gap-2 pt-1'>
						<Button
							disabled={isPending}
							onClick={() => setEditTarget(null)}
							type='button'
							variant='outline'
						>
							{t('common.cancel')}
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? t('folder.saving') : t('common.save')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
