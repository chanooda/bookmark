import { Button } from '@bookmark/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@bookmark/ui/components/dialog';
import { Input } from '@bookmark/ui/components/input';
import { Label } from '@bookmark/ui/components/label';
import { cn } from '@bookmark/ui/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tagKeys } from '@/entities/tag';
import { useCreateTag } from '../api/useCreateTag';
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

const DEFAULT_COLOR = '#e07b54';

export function TagCreateDialog() {
	const { t } = useTranslation();
	const { createOpen, setCreateOpen } = useTagDialogStore();
	const queryClient = useQueryClient();
	const { mutate: createTag, isPending } = useCreateTag();
	const [name, setName] = useState('');
	const [color, setColor] = useState(DEFAULT_COLOR);

	useEffect(() => {
		if (createOpen) {
			setName('');
			setColor(DEFAULT_COLOR);
		}
	}, [createOpen]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		createTag(
			{ name: name.trim(), color },
			{
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: tagKeys.all });
					setCreateOpen(false);
				},
			},
		);
	}

	const isCustomColor = !TAG_PRESET_COLORS.includes(color);

	return (
		<Dialog onOpenChange={(open) => !isPending && setCreateOpen(open)} open={createOpen}>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>{t('tag.add')}</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='tag-name'>{t('tag.name')} *</Label>
						<Input
							autoFocus
							id='tag-name'
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

					<div className='flex justify-end gap-2 pt-1'>
						<Button
							disabled={isPending}
							onClick={() => setCreateOpen(false)}
							type='button'
							variant='outline'
						>
							{t('common.cancel')}
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? t('tag.adding') : t('common.add')}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
