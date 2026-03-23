import type { Tag } from '@bookmark/types';
import { cn } from '@bookmark/ui/lib/utils';
import { Folder, Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTags } from '@/entities/tag';
import { useBookmarkFilterStore } from '@/features/bookmark';
import { useFolderDialogStore } from '@/features/folder-manage';
import { useTagDialogStore } from '@/features/tag-manage';
import { FolderTree } from './FolderTree';

function SidebarSectionHeader({
	label,
	onAdd,
	addTitle,
}: {
	label: string;
	onAdd: () => void;
	addTitle: string;
}) {
	return (
		<div className='flex items-center justify-between px-2.5 pb-2'>
			<p className='font-label text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50'>
				{label}
			</p>
			<button
				className='rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground'
				onClick={onAdd}
				title={addTitle}
				type='button'
			>
				<Plus aria-hidden='true' className='h-3 w-3' />
			</button>
		</div>
	);
}

interface TagRowProps {
	tag: Tag;
	isSelected: boolean;
	onSelect: () => void;
	onEdit: () => void;
}

function TagRow({ tag, isSelected, onSelect, onEdit }: TagRowProps) {
	const { t } = useTranslation();

	return (
		<div className='group flex items-center'>
			<button
				className={cn(
					'flex flex-1 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all',
					isSelected
						? 'bg-primary/12 font-medium text-primary'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground',
				)}
				onClick={onSelect}
				type='button'
			>
				<span className='h-2 w-2 shrink-0 rounded-full' style={{ backgroundColor: tag.color }} />
				<span className='truncate'>{tag.name}</span>
			</button>
			<button
				className='mr-1 shrink-0 rounded-md p-0.5 text-muted-foreground/40 opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100'
				onClick={onEdit}
				title={t('sidebar.editTag')}
				type='button'
			>
				<Pencil aria-hidden='true' className='h-3 w-3' />
			</button>
		</div>
	);
}

interface FolderSectionProps {
	selectedFolderId: string | undefined;
	onSelectAll: () => void;
	onAdd: () => void;
}

function FolderSection({ selectedFolderId, onSelectAll, onAdd }: FolderSectionProps) {
	const { t } = useTranslation();

	return (
		<div className='mb-5 flex h-1/2 flex-col gap-0.5 overflow-y-auto'>
			<SidebarSectionHeader
				addTitle={t('sidebar.addFolder')}
				label={t('sidebar.folders')}
				onAdd={onAdd}
			/>
			<button
				className={cn(
					'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-all',
					selectedFolderId === 'unorganized'
						? 'bg-primary/12 font-medium text-primary'
						: 'text-muted-foreground hover:bg-accent hover:text-foreground',
				)}
				onClick={onSelectAll}
				type='button'
			>
				<Folder aria-hidden='true' className='h-3.5 w-3.5 shrink-0' strokeWidth={1.75} />
				<span>{t('sidebar.all')}</span>
			</button>
			<FolderTree />
		</div>
	);
}

interface TagSectionProps {
	tags: Tag[];
	selectedTagId: string | undefined;
	onSelectTag: (tagId: string) => void;
	onEditTag: (tag: Tag) => void;
	onAdd: () => void;
}

function TagSection({ tags, selectedTagId, onSelectTag, onEditTag, onAdd }: TagSectionProps) {
	const { t } = useTranslation();

	return (
		<>
			<SidebarSectionHeader
				addTitle={t('sidebar.addTag')}
				label={t('sidebar.tags')}
				onAdd={onAdd}
			/>
			<div className='flex h-1/2 flex-col gap-0.5 overflow-y-auto'>
				{tags.map((tag) => (
					<TagRow
						isSelected={selectedTagId === tag.id}
						key={tag.id}
						onEdit={() => onEditTag(tag)}
						onSelect={() => onSelectTag(tag.id)}
						tag={tag}
					/>
				))}
			</div>
		</>
	);
}

export function Sidebar() {
	const { data: tags = [] } = useTags();
	const { selectedTagId, setSelectedTagId, selectedFolderId, setSelectedFolderId } =
		useBookmarkFilterStore();
	const { setCreateOpen: setTagCreateOpen, setEditTarget } = useTagDialogStore();
	const { setCreateOpen: setFolderCreateOpen } = useFolderDialogStore();

	return (
		<aside className='flex h-full w-56 shrink-0 flex-col mt-4'>
			<FolderSection
				onAdd={() => setFolderCreateOpen(true, 'root')}
				onSelectAll={() => {
					setSelectedFolderId('unorganized');
					setSelectedTagId(undefined);
				}}
				selectedFolderId={selectedFolderId}
			/>

			<div className='mb-4 shrink-0 border-t border-border/40' />

			<TagSection
				onAdd={() => setTagCreateOpen(true)}
				onEditTag={setEditTarget}
				onSelectTag={(tagId) => {
					setSelectedTagId(tagId);
					setSelectedFolderId(undefined);
				}}
				selectedTagId={selectedTagId}
				tags={tags}
			/>
		</aside>
	);
}
