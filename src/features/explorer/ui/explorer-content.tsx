import { useQuery } from '@tanstack/react-query';
import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { findById } from '@/entities/bookmark/libs/findBookmarkById';
import { queries } from '@/shared/api';
import { useExplorerStore } from '../model/explorer.store';
import { ExplorerBookmarkCard } from './explorer-bookmark-card';
import { ExplorerContentHeader } from './explorer-content-header';
import { ExplorerFolderCard } from './explorer-folder-card';

const EmptyState = () => {
	const { t } = useTranslation();
	return (
		<div className='flex h-full flex-col items-center justify-center gap-3 pb-8'>
			<div
				className='flex size-12 items-center justify-center rounded-2xl'
				style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
			>
				<FolderIcon
					className='size-5'
					fill='currentColor'
					style={{ color: 'rgba(255,255,255,0.25)' }}
				/>
			</div>
			<p className='text-[13px]' style={{ color: 'rgba(255,255,255,0.3)' }}>
				{t('explorer.emptyFolder')}
			</p>
		</div>
	);
};

const SkeletonCard = () => (
	<div
		className='h-22 w-full animate-pulse rounded-2xl'
		style={{ background: 'rgba(255,255,255,0.05)' }}
	/>
);

export const ExplorerContent = () => {
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);

	const { data, isLoading } = useQuery({
		...queries.bookmarks.all,
		enabled: !!currentId,
	});

	const bookmarkById = findById(data?.flat || [], currentId);
	const children = bookmarkById?.children || [];
	const isEmpty = !isLoading && children?.length === 0;

	return (
		<div className='flex h-full w-full flex-col overflow-auto'>
			<ExplorerContentHeader />

			<div
				className='flex-1 overflow-y-auto px-4 py-3'
				style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
			>
				{isLoading ? (
					<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: 	스켈레톤
							<SkeletonCard key={i} />
						))}
					</div>
				) : isEmpty ? (
					<EmptyState />
				) : (
					<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
						{children?.map((item) =>
							item.children !== undefined ? (
								<ExplorerFolderCard
									bookmark={item}
									key={item.id}
									onClick={() => navigate(item.id)}
								/>
							) : (
								<ExplorerBookmarkCard bookmark={item} key={item.id} />
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
};
