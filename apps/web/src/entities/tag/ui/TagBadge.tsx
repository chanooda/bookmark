import type { Tag } from '@bookmark/types';
import { Badge } from '@bookmark/ui/components/badge';

export function TagBadge({ tag }: { tag: Tag }) {
	return (
		<Badge
			className='text-xs'
			style={{ backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color }}
			variant='secondary'
		>
			{tag.name}
		</Badge>
	);
}
