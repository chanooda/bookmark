import { ApiAdapter, setAuthToken } from '@repo/api-client';
import type { Bookmark, CreateBookmarkDto, UpdateBookmarkDto } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Switch } from '@repo/ui/components/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { bookmarkKeys, useBookmarks } from '@/entities/bookmark/model/useBookmarks';
import { buildFolderTree, flattenFolderTree } from '@/entities/folder/model/folderTree';
import { useFolders } from '@/entities/folder/model/useFolders';
import { tagKeys, useTags } from '@/entities/tag/model/useTags';
import { TagSelector } from '@/entities/tag/ui/TagSelector';
import { fetchUrlMetadata } from '@/shared/api/metadata';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useAppSettings } from '@/shared/lib/settings';
import { migrateLocalToApi, useStorageAdapter, useStorageContext } from '@/shared/lib/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function PopupPage() {
	const adapter = useStorageAdapter();
	const { mode, switchToApi } = useStorageContext();
	const queryClient = useQueryClient();
	const { settings, isLoaded: isSettingsLoaded, updateSettings } = useAppSettings();
	const chromeSyncService = useChromeSyncService(settings.syncMode);

	const [currentTab, setCurrentTab] = useState({ url: '', title: '' });
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

	// Fetch all bookmarks to check if current URL is already bookmarked
	const {
		data: bookmarks = [],
		isLoading: isLoadingBookmarks,
		isError: isBookmarkError,
		error: bookmarkError,
	} = useBookmarks();
	const { data: tags = [] } = useTags();
	const { data: folders = [] } = useFolders();

	// Find existing bookmark for current tab URL
	const existingBookmark: Bookmark | undefined = currentTab.url
		? bookmarks.find((b) => b.url === currentTab.url)
		: undefined;

	const isEditMode = !!existingBookmark;

	// Controlled URL and title state
	const [urlValue, setUrlValue] = useState('');
	const [titleValue, setTitleValue] = useState('');
	const titleManuallyEdited = useRef(false);
	const originalUrl = useRef('');

	useEffect(() => {
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
				if (tab) setCurrentTab({ url: tab.url ?? '', title: tab.title ?? '' });
			});
		}
	}, []);

	// Sync state when switching between create/edit mode or when tab changes
	useEffect(() => {
		const initialUrl = existingBookmark?.url ?? currentTab.url;
		const initialTitle = existingBookmark?.title ?? currentTab.title;
		setUrlValue(initialUrl);
		setTitleValue(initialTitle);
		setSelectedFolderId(existingBookmark?.folderId ?? undefined);
		originalUrl.current = initialUrl;
		titleManuallyEdited.current = false;
	}, [existingBookmark, currentTab]);

	// Sync selected tags when switching to edit mode
	useEffect(() => {
		if (existingBookmark) {
			setSelectedTagIds(existingBookmark.tags.map((t) => t.id));
		} else {
			setSelectedTagIds([]);
		}
	}, [existingBookmark]);

	// Favicon preview
	const faviconPreview = useMemo(() => {
		try {
			const { hostname } = new URL(urlValue);
			return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
		} catch {
			return null;
		}
	}, [urlValue]);

	// Auto title: fires when url changes from original
	useEffect(() => {
		if (!urlValue || urlValue === originalUrl.current || titleManuallyEdited.current) return;
		const timer = setTimeout(async () => {
			const meta = await fetchUrlMetadata(urlValue);
			if (meta.title && !titleManuallyEdited.current) {
				setTitleValue(meta.title);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [urlValue]);

	const {
		mutate: createBookmark,
		isPending: isCreating,
		isSuccess: isCreated,
	} = useMutation({
		mutationFn: (dto: CreateBookmarkDto) => adapter.createBookmark(dto),
		onSuccess: (bookmark: Bookmark) => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			if (chromeSyncService) {
				chromeSyncService
					.syncCreateBookmark(bookmark, folders)
					.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
			}
		},
	});

	const {
		mutate: updateBookmark,
		isPending: isUpdating,
		isSuccess: isUpdated,
	} = useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpdateBookmarkDto }) =>
			adapter.updateBookmark(id, dto),
		onSuccess: (bookmark: Bookmark) => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			if (chromeSyncService) {
				chromeSyncService
					.syncUpdateBookmark(bookmark, folders)
					.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
			}
		},
	});

	const { mutate: deleteBookmark, isPending: isDeleting } = useMutation({
		mutationFn: (id: string) => adapter.deleteBookmark(id),
		onSuccess: (_, deletedId: string) => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			if (chromeSyncService) {
				chromeSyncService
					.syncDeleteBookmark(deletedId)
					.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
			}
		},
	});

	function handleLoginDone() {
		const token = localStorage.getItem('auth_token');
		if (!token) return;
		setAuthToken(token);
		const apiAdapter = new ApiAdapter();
		migrateLocalToApi(apiAdapter)
			.then(() => {
				switchToApi();
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
				queryClient.invalidateQueries({ queryKey: tagKeys.all });
			})
			.catch(() => {
				toast.error('데이터 마이그레이션에 실패했습니다. 다시 시도해 주세요.');
			});
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const description = (data.get('description') as string) || undefined;

		if (isEditMode && existingBookmark) {
			updateBookmark({
				id: existingBookmark.id,
				dto: {
					url: urlValue,
					title: titleValue,
					description,
					tagIds: selectedTagIds,
					folderId: selectedFolderId ?? null,
				},
			});
		} else {
			createBookmark({
				url: urlValue,
				title: titleValue,
				description,
				tagIds: selectedTagIds,
				folderId: selectedFolderId,
			});
		}
	}

	function handleDelete() {
		if (existingBookmark) deleteBookmark(existingBookmark.id);
	}

	const isSuccess = isCreated || isUpdated;
	const isPending = isCreating || isUpdating;

	if (isSuccess) {
		return (
			<div className='flex h-[200px] w-[320px] flex-col items-center justify-center gap-3 p-6'>
				<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
					<svg
						aria-hidden='true'
						className='h-5 w-5'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path d='M5 13l4 4L19 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
					</svg>
				</div>
				<p className='text-sm font-medium'>
					{isCreated ? '북마크가 저장됐어요!' : '북마크가 수정됐어요!'}
				</p>
				<Button onClick={() => window.close()} size='sm' variant='outline'>
					닫기
				</Button>
			</div>
		);
	}

	if (isBookmarkError) {
		return (
			<div className='flex h-[160px] w-[320px] flex-col items-center justify-center gap-2 p-4'>
				<p className='text-xs font-medium text-destructive'>스토리지 오류</p>
				<p className='text-center text-xs text-muted-foreground'>
					{bookmarkError instanceof Error
						? bookmarkError.message
						: '알 수 없는 오류가 발생했습니다'}
				</p>
			</div>
		);
	}

	if (isLoadingBookmarks) {
		return (
			<div className='flex h-[160px] w-[320px] items-center justify-center'>
				<p className='text-xs text-muted-foreground'>불러오는 중...</p>
			</div>
		);
	}

	const flatFolders = flattenFolderTree(buildFolderTree(folders));

	return (
		<form
			className='flex w-[320px] flex-col gap-3 p-4'
			key={existingBookmark?.id ?? 'create'}
			onSubmit={handleSubmit}
		>
			<div className='flex items-center justify-between pb-1'>
				<div className='flex items-center gap-2'>
					<svg
						aria-hidden='true'
						className='h-4 w-4 shrink-0'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
						/>
					</svg>
					<span className='text-sm font-semibold'>
						{isEditMode ? '북마크 수정' : '북마크 추가'}
					</span>
				</div>
				<div className='flex items-center gap-1'>
					{isEditMode && (
						<Button
							className='h-6 text-xs'
							disabled={isDeleting}
							onClick={handleDelete}
							size='sm'
							type='button'
							variant='ghost'
						>
							{isDeleting ? '삭제 중...' : '삭제'}
						</Button>
					)}
					{mode === 'local' && (
						<>
							<Button asChild className='h-6 text-xs' size='sm' variant='ghost'>
								<a href={`${API_URL}/auth/google`} rel='noreferrer' target='_blank'>
									동기화
								</a>
							</Button>
							<Button
								className='h-6 text-xs'
								onClick={handleLoginDone}
								size='sm'
								type='button'
								variant='ghost'
							>
								로그인했어요
							</Button>
						</>
					)}
				</div>
			</div>

			{isSettingsLoaded && (
				<div className='flex flex-col gap-1'>
					<div className='flex items-center justify-between rounded-md border border-border px-3 py-2'>
						<Label className='cursor-pointer text-xs' htmlFor='popup-realtime-sync'>
							Chrome 북마크 실시간 동기화
						</Label>
						<Switch
							checked={settings.syncMode !== 'off'}
							id='popup-realtime-sync'
							onCheckedChange={(checked) =>
								updateSettings({ syncMode: checked ? 'web-to-chrome' : 'off' })
							}
							size='sm'
						/>
					</div>
					{settings.syncMode !== 'off' && (
						<p className='text-xs text-destructive'>
							⚠ 삭제 시 Chrome 북마크에서도 영구적으로 삭제됩니다.
						</p>
					)}
				</div>
			)}

			<div className='flex flex-col gap-1'>
				<Label className='text-xs' htmlFor='url'>
					URL
				</Label>
				<div className='flex items-center gap-1.5'>
					{faviconPreview && (
						<img alt='' className='h-4 w-4 shrink-0 rounded' src={faviconPreview} />
					)}
					<Input
						className='h-8 flex-1 text-xs'
						id='url'
						name='url'
						onChange={(e) => {
							setUrlValue(e.target.value);
							titleManuallyEdited.current = false;
						}}
						required
						type='url'
						value={urlValue}
					/>
				</div>
			</div>
			<div className='flex flex-col gap-1'>
				<Label className='text-xs' htmlFor='title'>
					제목
				</Label>
				<Input
					className='h-8 text-xs'
					id='title'
					name='title'
					onChange={(e) => {
						setTitleValue(e.target.value);
						titleManuallyEdited.current = true;
					}}
					required
					value={titleValue}
				/>
			</div>
			<div className='flex flex-col gap-1'>
				<Label className='text-xs' htmlFor='description'>
					설명
				</Label>
				<Input
					className='h-8 text-xs'
					defaultValue={existingBookmark?.description ?? ''}
					id='description'
					name='description'
					placeholder='선택'
				/>
			</div>

			{folders.length > 0 && (
				<div className='flex flex-col gap-1'>
					<Label className='text-xs'>폴더</Label>
					<select
						className='h-8 rounded-md border border-input bg-background px-2 text-xs'
						onChange={(e) => setSelectedFolderId(e.target.value || undefined)}
						value={selectedFolderId ?? ''}
					>
						<option value=''>폴더 없음</option>
						{flatFolders.map((f) => (
							<option key={f.id} value={f.id}>
								{'　'.repeat(f.depth)}
								{f.name}
							</option>
						))}
					</select>
				</div>
			)}

			<div className='flex flex-col gap-1'>
				<Label className='text-xs'>태그</Label>
				<TagSelector
					onToggle={(id) =>
						setSelectedTagIds((prev) =>
							prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
						)
					}
					selected={selectedTagIds}
					tags={tags}
				/>
			</div>

			<Button className='mt-1' disabled={isPending} size='sm' type='submit'>
				{isPending ? (isEditMode ? '수정 중...' : '저장 중...') : isEditMode ? '수정' : '저장'}
			</Button>
		</form>
	);
}
