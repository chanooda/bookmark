import { Button } from '@bookmark/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bookmark/ui/components/dialog';
import { Input } from '@bookmark/ui/components/input';
import { Label } from '@bookmark/ui/components/label';
import { cn } from '@bookmark/ui/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bookmarkKeys } from '@/entities/bookmark';
import { tagKeys } from '@/entities/tag';
import { useBookmarkFilterStore } from '@/features/bookmark';
import { useDeleteTag } from '../api/useDeleteTag';
import { useEditTag } from '../api/useEditTag';
import { useTagDialogStore } from '../model/tagDialogStore';

const TAG_PRESET_COLORS = [
	'#ef4444',
	'#f97316',
	'#e07b54',
	'#eab308',
	'#22c55e',
	'#06b6d4',
	'#3b82f6',
	'#8b5cf6',
	'#ec4899',
	'#f43f5e',
	'#14b8a6',
	'#64748b',
];

export function TagEditDialog() {
	const { t } = useTranslation();
	const { editTarget, setEditTarget } = useTagDialogStore();
	const queryClient = useQueryClient();
	const { mutate: editTag, isPending: isEditing } = useEditTag();
	const { mutate: deleteTag } = useDeleteTag();
	const { selectedTagId, setSelectedTagId } = useBookmarkFilterStore();
	const [name, setName] = useState('');
	const [color, setColor] = useState('');

	useEffect(() => {
		if (editTarget) {
			setName(editTarget.name);
			setColor(editTarget.color);
		}
	}, [editTarget]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!editTarget || !name.trim()) return;
		editTag(
			{ id: editTarget.id, dto: { name: name.trim(), color } },
			{
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: tagKeys.all });
					setEditTarget(null);
				},
			},
		);
	}

	function handleDelete() {
		if (!editTarget) return;
		if (selectedTagId === editTarget.id) setSelectedTagId(undefined);
		setEditTarget(null);
		deleteTag(editTarget.id, {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: tagKeys.all });
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			},
		});
	}

	const isCustomColor = !TAG_PRESET_COLORS.includes(color);

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!isEditing && !open) {
					setEditTarget(null);
				}
			}}
			open={editTarget !== null}
		>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>{t('tag.edit')}</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='tag-edit-name'>{t('tag.name')} *</Label>
						<Input
							autoFocus
							id='tag-edit-name'
							onChange={(e) => setName(e.target.value)}
							placeholder={t('tag.namePlaceholder')}
							required
							value={name}
						/>
					</div>

					<div className='flex flex-col gap-2'>
						<Label>{t('tag.color')}</Label>
						<div className='grid grid-cols-6 gap-2'>
							{TAG_PRESET_COLORS.map((presetColor) => (
								<button
									className={cn(
										'h-7 w-7 rounded-full transition-all duration-150 hover:scale-110',
										color === presetColor && 'scale-110 ring-2 ring-foreground/30 ring-offset-2',
									)}
									key={presetColor}
									onClick={() => setColor(presetColor)}
									style={{ backgroundColor: presetColor }}
									title={presetColor}
									type='button'
								/>
							))}
							<label
								className={cn(
									'relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground transition-all duration-150 hover:scale-110 hover:border-foreground/60 hover:text-foreground',
									isCustomColor &&
										'scale-110 border-solid border-transparent ring-2 ring-foreground/30 ring-offset-2',
								)}
								style={isCustomColor ? { backgroundColor: color } : undefined}
								title={t('tag.customColor')}
							>
								<input
									className='sr-only'
									onChange={(e) => setColor(e.target.value)}
									type='color'
									value={color}
								/>
								{!isCustomColor && (
									<svg
										aria-hidden='true'
										className='h-3 w-3'
										fill='none'
										stroke='currentColor'
										viewBox='0 0 24 24'
									>
										<path
											d='M12 4v16m8-8H4'
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={2}
										/>
									</svg>
								)}
							</label>
						</div>
					</div>

					{name.trim() && (
						<div className='rounded-md border border-border/50 bg-muted/30 px-3 py-2'>
							<p className='mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50'>
								{t('tag.preview')}
							</p>
							<div className='flex items-center gap-2'>
								<span
									className='h-2 w-2 shrink-0 rounded-full'
									style={{ backgroundColor: color }}
								/>
								<span className='text-sm text-foreground/80'>{name}</span>
							</div>
						</div>
					)}

					<div className='flex items-center justify-between pt-1'>
						<Button
							className='text-destructive hover:text-destructive'
							onClick={handleDelete}
							type='button'
							variant='ghost'
						>
							{t('tag.delete')}
						</Button>
						<div className='flex gap-2'>
							<Button
								disabled={isEditing}
								onClick={() => setEditTarget(null)}
								type='button'
								variant='outline'
							>
								{t('common.cancel')}
							</Button>
							<Button disabled={isEditing} type='submit'>
								{isEditing ? t('tag.saving') : t('common.save')}
							</Button>
						</div>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
