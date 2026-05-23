import type { Bookmark } from '@/entities/bookmark';

export function findPath(nodes: Bookmark[], targetId: string): Bookmark[] {
	for (const node of nodes) {
		if (node.id === targetId) return [node];
		if (node.children?.length) {
			const path = findPath(node.children as Bookmark[], targetId);
			if (path.length) return [node, ...path];
		}
	}
	return [];
}
