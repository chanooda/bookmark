import type { Folder } from '@bookmark/types';

export interface FolderNode extends Folder {
	children: FolderNode[];
	depth: number;
}

export function buildFolderTree(
	folders: Folder[],
	parentId: string | null = null,
	depth = 0,
): FolderNode[] {
	return folders
		.filter((f) => f.parentId === parentId)
		.sort((a, b) => a.order - b.order)
		.map((f) => ({
			...f,
			depth,
			children: buildFolderTree(folders, f.id, depth + 1),
		}));
}

/** Flatten tree to ordered list with depth for rendering in a <select> */
export function flattenFolderTree(nodes: FolderNode[]): FolderNode[] {
	return nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)]);
}
