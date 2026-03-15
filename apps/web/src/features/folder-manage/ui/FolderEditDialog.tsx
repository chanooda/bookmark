import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useEffect, useState } from 'react';
import { useEditFolder } from '../api/useEditFolder';
import { useFolderDialogStore } from '../model/folderDialogStore';

export function FolderEditDialog() {
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
					<DialogTitle>폴더 이름 변경</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='folder-edit-name'>이름 *</Label>
						<Input
							autoFocus
							id='folder-edit-name'
							onChange={(e) => setName(e.target.value)}
							placeholder='폴더 이름'
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
							취소
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? '저장 중...' : '저장'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
