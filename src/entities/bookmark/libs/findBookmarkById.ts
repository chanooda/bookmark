import type { BookmarkNode } from '@/shared/api';

export const findById = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
	for (const node of nodes) {
		if (node.id === id) return node;
		if (node.children) {
			const found = findById(node.children, id);
			if (found) return found;
		}
	}
	return null;
};
