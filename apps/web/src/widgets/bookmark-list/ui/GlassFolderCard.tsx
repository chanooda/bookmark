import type { Bookmark, Folder } from '@bookmark/types';
import { Check, Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { stripProtocol } from '@/shared/lib/url';
import { FaviconImg } from '@/shared/ui';

export interface FolderGroup {
	id: string | null;
	name: string;
	bookmarks: Bookmark[];
	folder: Folder | null;
	subfolders: Folder[];
}

export interface GlassFolderCardProps {
	group: FolderGroup;
	onClick: () => void;
	onRename: (id: string, name: string) => void;
	onDelete: (id: string) => void;
	animationDelay: number;
	zIndex?: number;
}

export function GlassFolderCard({
	group,
	onClick,
	onRename,
	onDelete,
	animationDelay,
	zIndex = 0,
}: GlassFolderCardProps) {
	const MAX_ITEMS = 5;
	const displaySubfolders = group.subfolders.slice(0, MAX_ITEMS);
	const displayBookmarks = group.bookmarks.slice(0, MAX_ITEMS - displaySubfolders.length);
	const totalShown = displaySubfolders.length + displayBookmarks.length;
	const remainingCount = group.subfolders.length + group.bookmarks.length - totalShown;

	const [menuOpen, setMenuOpen] = useState(false);
	const [renaming, setRenaming] = useState(false);
	const [nameInput, setNameInput] = useState(group.name);
	const [hovered, setHovered] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setNameInput(group.name);
	}, [group.name]);

	useEffect(() => {
		if (!renaming) return;
		const t = setTimeout(() => inputRef.current?.focus(), 50);
		return () => clearTimeout(t);
	}, [renaming]);

	useEffect(() => {
		if (!menuOpen) return;
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [menuOpen]);

	function handleRenameSubmit() {
		const trimmed = nameInput.trim();
		if (trimmed && trimmed !== group.name && group.id) {
			onRename(group.id, trimmed);
		}
		setRenaming(false);
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover state used only for z-index stacking, not interaction
		<div
			className='group relative flex flex-col items-center gap-1.5'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ animationDelay: `${animationDelay}ms`, zIndex: hovered ? 1000 : zIndex }}
		>
			{/* ⋯ context menu trigger — only for named folders */}
			{group.id && (
				<div className='absolute top-1 right-1 z-20' ref={menuRef}>
					<button
						className='flex h-6 w-6 items-center justify-center rounded-md text-white/0 transition-all duration-150 hover:bg-white/20 hover:text-white group-hover:text-white/50'
						onClick={(e) => {
							e.stopPropagation();
							setMenuOpen((v) => !v);
						}}
						title='폴더 관리'
						type='button'
					>
						<MoreVertical aria-hidden='true' className='h-3.5 w-3.5' fill='currentColor' />
					</button>

					{/* Dropdown */}
					{menuOpen && (
						<div
							className='absolute top-7 right-0 z-30 min-w-[130px] overflow-hidden rounded-xl py-1 shadow-2xl'
							style={{
								backdropFilter: 'blur(24px)',
								WebkitBackdropFilter: 'blur(24px)',
								background: 'rgba(20,18,24,0.95)',
								border: '1px solid rgba(255,255,255,0.14)',
								boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
							}}
						>
							<button
								className='flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white'
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(false);
									setRenaming(true);
								}}
								type='button'
							>
								<Pencil aria-hidden='true' className='h-3.5 w-3.5 shrink-0' />
								이름 변경
							</button>
							<div className='mx-3 my-1 h-px bg-white/8' />
							<button
								className='flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-red-400/80 transition-colors hover:bg-red-500/15 hover:text-red-400'
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(false);
									if (group.id) onDelete(group.id);
								}}
								type='button'
							>
								<Trash2 aria-hidden='true' className='h-3.5 w-3.5 shrink-0' />
								폴더 삭제
							</button>
						</div>
					)}
				</div>
			)}

			{/* Glass tile */}
			<button
				className='relative w-full h-[250px] overflow-hidden rounded-[16px] p-2.5 transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
				onClick={onClick}
				style={{
					aspectRatio: '1',
					backdropFilter: 'blur(24px)',
					WebkitBackdropFilter: 'blur(24px)',
					background: 'rgba(255,255,255,0.10)',
					border: '1px solid rgba(255,255,255,0.20)',
					boxShadow: '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.20)',
					transition: 'transform 0.2s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease',
				}}
				type='button'
			>
				{/* Shine */}
				<div
					aria-hidden='true'
					className='pointer-events-none absolute inset-0 rounded-[16px]'
					style={{
						background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%)',
					}}
				/>

				{/* Mini bookmark list */}
				<div className='relative z-10 flex h-full flex-col justify-start gap-2'>
					{/* Folder title at top */}
					<div className='mb-0.5 flex items-center gap-1.5 border-b border-white/15 pb-2'>
						<span className='min-w-0 flex-1 truncate text-left text-sm font-bold leading-tight text-white/95'>
							{group.name}
						</span>
					</div>

					{totalShown === 0 ? (
						<p className='text-center text-sm text-white/25'>비어 있음</p>
					) : (
						<>
							{/* Subfolder rows */}
							{displaySubfolders.map((sf) => (
								<div className='flex min-w-0 items-center gap-2' key={sf.id}>
									<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]'>
										<FolderIcon
											aria-hidden='true'
											className='size-6 text-blue-200/80'
											fill='currentColor'
											strokeWidth={0}
										/>
									</div>
									<span className='min-w-0 flex-1 truncate text-left text-[12px] font-semibold leading-tight text-white/80'>
										{sf.name}
									</span>
								</div>
							))}

							{/* Divider between subfolders and bookmarks */}
							{displaySubfolders.length > 0 && displayBookmarks.length > 0 && (
								<div className='h-px bg-white/12' />
							)}

							{/* Bookmark rows */}
							{displayBookmarks.map((bm) => {
								const letter = (bm.title || bm.url).charAt(0).toUpperCase();
								const title = bm.title || stripProtocol(bm.url);
								return (
									<div className='flex min-w-0 items-center gap-2' key={bm.id}>
										{bm.favicon ? (
											<FaviconImg
												globeClassName='size-4 text-white/50'
												imgClassName='size-4 object-cover'
												src={bm.favicon}
											/>
										) : (
											<span className='text-[10px] font-bold text-white'>{letter}</span>
										)}
										<span className='min-w-0 flex-1 truncate text-left text-[12px] font-medium leading-tight text-white/75'>
											{title}
										</span>
									</div>
								);
							})}
						</>
					)}

					{remainingCount > 0 && (
						<div className='flex items-center gap-1'>
							<div className='h-px flex-1 bg-white/10' />
							<span className='text-[11px] font-medium text-white/28'>+{remainingCount}</span>
							<div className='h-px flex-1 bg-white/10' />
						</div>
					)}
				</div>
			</button>

			{/* Rename form — folder title is now inside the card */}
			{renaming && (
				<form
					className='flex w-full items-center gap-1 px-0.5'
					onSubmit={(e) => {
						e.preventDefault();
						handleRenameSubmit();
					}}
				>
					<input
						className='min-w-0 flex-1 rounded-lg bg-white/12 px-2 py-1 text-center text-[12px] font-medium text-white outline-none ring-1 ring-white/25 focus:ring-white/50'
						onChange={(e) => setNameInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								setRenaming(false);
								setNameInput(group.name);
							}
						}}
						ref={inputRef}
						type='text'
						value={nameInput}
					/>
					<button
						className='flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/15 text-white/80 hover:bg-white/25'
						title='저장'
						type='submit'
					>
						<Check aria-hidden='true' className='h-2.5 w-2.5' strokeWidth={2.5} />
					</button>
				</form>
			)}
		</div>
	);
}
