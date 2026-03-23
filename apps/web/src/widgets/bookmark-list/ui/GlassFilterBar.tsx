import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFolders } from '@/entities/folder';
import { useTags } from '@/entities/tag';
import { useBookmarkFilterStore } from '@/features/bookmark';
import { useFolderDialogStore } from '@/features/folder-manage';
import { useTagDialogStore } from '@/features/tag-manage';

export function GlassFilterBar() {
	const { t } = useTranslation();
	const {
		selectedTagId,
		setSelectedTagId,
		selectedFolderIds,
		toggleSelectedFolderId,
		clearSelectedFolderIds,
	} = useBookmarkFilterStore();
	const { data: folders = [] } = useFolders();
	const { data: tags = [] } = useTags();
	const { setCreateOpen: setFolderCreateOpen } = useFolderDialogStore();
	const { setCreateOpen: setTagCreateOpen } = useTagDialogStore();

	return (
		<div className='flex flex-col gap-2 px-6 pb-3 pt-2'>
			{/* 폴더 필터 */}
			<div className='flex items-center gap-3'>
				<span className='w-7 shrink-0 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35'>
					{t('filterBar.folders')}
				</span>
				<div className='flex flex-1 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
					<button
						className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 ${
							selectedFolderIds.length === 0
								? 'bg-white/22 text-white shadow-sm'
								: 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/75'
						}`}
						onClick={clearSelectedFolderIds}
						type='button'
					>
						{t('filterBar.all')}
					</button>
					{folders.map((folder) => (
						<button
							className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 ${
								selectedFolderIds.includes(folder.id)
									? 'bg-white/22 text-white shadow-sm'
									: 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/75'
							}`}
							key={folder.id}
							onClick={() => toggleSelectedFolderId(folder.id)}
							type='button'
						>
							{folder.name}
						</button>
					))}
					<button
						className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/35 transition-all hover:bg-white/16 hover:text-white/65'
						onClick={() => setFolderCreateOpen(true, 'root')}
						title={t('filterBar.addFolder')}
						type='button'
					>
						<Plus aria-hidden='true' className='h-3 w-3' strokeWidth={2.5} />
					</button>
				</div>
			</div>

			{/* 태그 필터 */}
			{tags.length > 0 && (
				<div className='flex items-center gap-3'>
					<span className='w-7 shrink-0 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35'>
						{t('filterBar.tags')}
					</span>
					<div className='flex flex-1 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
						<button
							className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 ${
								selectedTagId === undefined
									? 'bg-white/22 text-white shadow-sm'
									: 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/75'
							}`}
							onClick={() => setSelectedTagId(undefined)}
							type='button'
						>
							{t('filterBar.all')}
						</button>
						{tags.map((tag) => (
							<button
								className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150 ${
									selectedTagId === tag.id
										? 'bg-white/22 text-white shadow-sm'
										: 'bg-white/8 text-white/50 hover:bg-white/15 hover:text-white/75'
								}`}
								key={tag.id}
								onClick={() => setSelectedTagId(tag.id)}
								type='button'
							>
								<span
									className='h-1.5 w-1.5 shrink-0 rounded-full'
									style={{ backgroundColor: tag.color }}
								/>
								{tag.name}
							</button>
						))}
						<button
							className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/35 transition-all hover:bg-white/16 hover:text-white/65'
							onClick={() => setTagCreateOpen(true)}
							title={t('filterBar.addTag')}
							type='button'
						>
							<Plus aria-hidden='true' className='h-3 w-3' strokeWidth={2.5} />
						</button>
					</div>
				</div>
			)}
			{tags.length === 0 && (
				<div className='flex items-center gap-3'>
					<span className='w-7 shrink-0 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35'>
						{t('filterBar.tags')}
					</span>
					<button
						className='flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] text-white/40 transition-all hover:bg-white/16 hover:text-white/65'
						onClick={() => setTagCreateOpen(true)}
						type='button'
					>
						<Plus aria-hidden='true' className='h-3 w-3' strokeWidth={2.5} />
						{t('filterBar.addTag')}
					</button>
				</div>
			)}
		</div>
	);
}
