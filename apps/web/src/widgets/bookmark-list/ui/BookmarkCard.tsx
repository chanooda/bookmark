import type { Bookmark } from '@bookmark/types';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarkKeys, useDeleteBookmark } from '@/entities/bookmark';
import { TagBadge } from '@/entities/tag';
import { useBookmarkDialogStore } from '@/features/bookmark';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { stripProtocol } from '@/shared/lib/url';
import { FaviconImg } from '@/shared/ui';

interface BookmarkCardProps {
	bookmark: Bookmark;
}

// Deterministic warm palette for favicon letter-avatars
const AVATAR_PALETTES = [
	{ bg: '#2c1a12', text: '#e0845a' },
	{ bg: '#12202c', text: '#5a9ec2' },
	{ bg: '#141e12', text: '#78ad62' },
	{ bg: '#251a08', text: '#c8a040' },
	{ bg: '#201228', text: '#a06acc' },
	{ bg: '#0e201e', text: '#4aa898' },
];

function getAvatarPalette(str: string) {
	const hash = str.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

interface BookmarkAvatarProps {
	favicon?: string | null;
	fallbackLetter: string;
	palette: { bg: string; text: string };
	size: 'sm' | 'md';
}

function BookmarkAvatar({ favicon, fallbackLetter, palette, size }: BookmarkAvatarProps) {
	const sizeClasses =
		size === 'sm'
			? { wrapper: 'h-6 w-6 rounded-md text-[10px]', img: 'h-4 w-4 rounded', globe: 'h-3.5 w-3.5' }
			: { wrapper: 'h-7 w-7 rounded-lg text-xs', img: 'h-5 w-5 rounded-md', globe: 'h-4 w-4' };
	return (
		<div
			className={`flex ${sizeClasses.wrapper} shrink-0 items-center justify-center font-semibold`}
			style={favicon ? undefined : { backgroundColor: palette.bg, color: palette.text }}
		>
			{favicon ? (
				<FaviconImg
					globeClassName={`${sizeClasses.globe} text-muted-foreground/60`}
					imgClassName={sizeClasses.img}
					src={favicon}
				/>
			) : (
				fallbackLetter
			)}
		</div>
	);
}

function ActionButtons({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
	return (
		<div className='flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100'>
			<button
				className='rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground'
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onEdit();
				}}
				type='button'
			>
				<Pencil aria-hidden='true' className='h-3.5 w-3.5' />
			</button>
			<button
				className='rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/15 hover:text-destructive'
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onDelete();
				}}
				type='button'
			>
				<Trash2 aria-hidden='true' className='h-3.5 w-3.5' />
			</button>
		</div>
	);
}

function useBookmarkCardActions(bookmark: Bookmark) {
	const queryClient = useQueryClient();
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);
	const { setEditTarget } = useBookmarkDialogStore();
	const { mutate: deleteBookmark } = useDeleteBookmark();

	const palette = getAvatarPalette(bookmark.url);
	const fallbackLetter = (bookmark.title || bookmark.url).charAt(0).toUpperCase();

	function handleDelete() {
		deleteBookmark(bookmark.id, {
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
				if (chromeSyncService) {
					chromeSyncService
						.syncDeleteBookmark(bookmark.id)
						.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
				}
			},
		});
	}

	return {
		palette,
		fallbackLetter,
		handleDelete,
		handleEdit: () => setEditTarget(bookmark),
	};
}

export function BookmarkListCard({ bookmark }: BookmarkCardProps) {
	const { palette, fallbackLetter, handleDelete, handleEdit } = useBookmarkCardActions(bookmark);

	return (
		<a
			className='group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 transition-all hover:border-border/60 hover:bg-card'
			href={bookmark.url}
			rel='noopener noreferrer'
			target='_blank'
		>
			<BookmarkAvatar
				fallbackLetter={fallbackLetter}
				favicon={bookmark.favicon}
				palette={palette}
				size='sm'
			/>

			<span className='min-w-0 flex-1 truncate text-sm font-medium text-foreground/85'>
				{bookmark.title}
			</span>

			<div className='hidden shrink-0 items-center gap-3 sm:flex'>
				{bookmark.tags.length > 0 && (
					<div className='flex gap-1'>
						{bookmark.tags.slice(0, 3).map((tag) => (
							<TagBadge key={tag.id} tag={tag} />
						))}
					</div>
				)}
				<p className='font-url hidden max-w-[180px] truncate text-muted-foreground/40 lg:block'>
					{stripProtocol(bookmark.url)}
				</p>
			</div>

			<ActionButtons onDelete={handleDelete} onEdit={handleEdit} />
		</a>
	);
}

export function BookmarkGridCard({ bookmark }: BookmarkCardProps) {
	const { palette, fallbackLetter, handleDelete, handleEdit } = useBookmarkCardActions(bookmark);

	return (
		<a
			className='group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-primary/25 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-0.5'
			href={bookmark.url}
			rel='noopener noreferrer'
			target='_blank'
		>
			<div className='flex items-center justify-between gap-2'>
				<div className='flex min-w-0 items-center gap-2.5'>
					<BookmarkAvatar
						fallbackLetter={fallbackLetter}
						favicon={bookmark.favicon}
						palette={palette}
						size='md'
					/>
					<span className='line-clamp-2 text-sm font-medium leading-snug text-foreground/90'>
						{bookmark.title}
					</span>
				</div>
				<ActionButtons onDelete={handleDelete} onEdit={handleEdit} />
			</div>

			{bookmark.description && (
				<p className='mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70'>
					{bookmark.description}
				</p>
			)}

			<div className='flex items-end justify-between gap-2 mt-3'>
				<div className='flex min-w-0 flex-wrap gap-1'>
					{bookmark.tags.map((tag) => (
						<TagBadge key={tag.id} tag={tag} />
					))}
				</div>
				<p className='font-url shrink-0 max-w-[110px] truncate text-muted-foreground/35'>
					{stripProtocol(bookmark.url)}
				</p>
			</div>
		</a>
	);
}
