import type { Tag } from '@repo/types';
import { useMemo } from 'react';

interface TagSelectorProps {
	tags: Tag[];
	selectedTagIds: string[];
	onToggle: (id: string) => void;
}

export function TagSelector({ tags, selectedTagIds, onToggle }: TagSelectorProps) {
	const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);
	if (tags.length === 0) return null;
	return (
		<div className='flex flex-wrap gap-1.5'>
			{tags.map((tag) => (
				<button
					className='rounded-full border px-3 py-0.5 text-xs transition-colors'
					key={tag.id}
					onClick={() => onToggle(tag.id)}
					style={
						selectedSet.has(tag.id)
							? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
							: {
									backgroundColor: `${tag.color}15`,
									color: tag.color,
									borderColor: tag.color,
								}
					}
					type='button'
				>
					{tag.name}
				</button>
			))}
		</div>
	);
}
