import type { Folder } from '@repo/types';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui/components/select';
import { buildFolderTree, flattenFolderTree } from '@/entities/folder';

interface FolderSelectProps {
	folders: Folder[];
	value: string | undefined;
	onChange: (folderId: string | undefined) => void;
}

export function FolderSelect({ folders, value, onChange }: FolderSelectProps) {
	const tree = buildFolderTree(folders);
	const flat = flattenFolderTree(tree);

	return (
		<Select
			onValueChange={(v) => onChange(v === '__none__' ? undefined : v)}
			value={value ?? '__none__'}
		>
			<SelectTrigger className='h-9 text-sm'>
				<SelectValue placeholder='폴더 선택 (선택)' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='__none__'>폴더 없음</SelectItem>
				{flat.map((folder) => (
					<SelectItem key={folder.id} value={folder.id}>
						{'\u00A0'.repeat(folder.depth * 2)}
						{folder.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
