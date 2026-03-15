import type { Folder } from '@repo/types';

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
		.map((f) => ({
			...f,
			depth,
			children: buildFolderTree(folders, f.id, depth + 1),
		}));
}

export function flattenFolderTree(nodes: FolderNode[]): FolderNode[] {
	return nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)]);
}
