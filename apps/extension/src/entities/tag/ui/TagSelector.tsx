import type { Tag } from '@repo/types';
import { useState } from 'react';
import { useCreateTag } from '@/features/tag-manage/model/useCreateTag';

interface TagSelectorProps {
	tags: Tag[];
	selected: string[];
	onToggle: (id: string) => void;
}

const DEFAULT_COLOR = '#6366f1';

export function TagSelector({ tags, selected, onToggle }: TagSelectorProps) {
	const { mutate: createTag, isPending } = useCreateTag();
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState('');
	const [color, setColor] = useState(DEFAULT_COLOR);

	function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;
		createTag(
			{ name: name.trim(), color },
			{
				onSuccess: () => {
					setName('');
					setColor(DEFAULT_COLOR);
					setShowForm(false);
				},
			},
		);
	}

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex flex-wrap gap-1.5'>
				{tags.map((tag) => (
					<button
						className='rounded-full border px-2.5 py-0.5 text-xs transition-colors'
						key={tag.id}
						onClick={() => onToggle(tag.id)}
						style={
							selected.includes(tag.id)
								? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
								: { backgroundColor: `${tag.color}15`, color: tag.color, borderColor: tag.color }
						}
						type='button'
					>
						{tag.name}
					</button>
				))}
				<button
					className='rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground'
					onClick={() => setShowForm((v) => !v)}
					type='button'
				>
					+ 태그
				</button>
			</div>

			{showForm && (
				<form className='flex gap-1.5' onSubmit={handleCreate}>
					<input
						className='flex-1 rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring'
						onChange={(e) => setName(e.target.value)}
						placeholder='태그 이름'
						type='text'
						value={name}
					/>
					<input
						className='h-6 w-8 cursor-pointer rounded border border-border'
						onChange={(e) => setColor(e.target.value)}
						type='color'
						value={color}
					/>
					<button
						className='rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground disabled:opacity-50'
						disabled={isPending}
						type='submit'
					>
						추가
					</button>
					<button
						className='rounded px-2 py-0.5 text-xs text-muted-foreground'
						onClick={() => setShowForm(false)}
						type='button'
					>
						취소
					</button>
				</form>
			)}
		</div>
	);
}
