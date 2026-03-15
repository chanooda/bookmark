import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUrlMetadata } from '@/shared/api/metadata';

interface UseBookmarkFormOptions {
	initialUrl?: string;
	initialTitle?: string;
	initialTagIds?: string[];
	initialFolderId?: string;
}

export function useBookmarkForm({
	initialUrl = '',
	initialTitle = '',
	initialTagIds = [],
	initialFolderId,
}: UseBookmarkFormOptions = {}) {
	const [url, setUrl] = useState(initialUrl);
	const [title, setTitle] = useState(initialTitle);
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
	const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(initialFolderId);
	const titleManuallyEdited = useRef(false);
	const originalUrl = useRef(initialUrl);

	// Auto title: debounce 500ms, skip if URL unchanged or title manually edited
	useEffect(() => {
		if (!url || url === originalUrl.current || titleManuallyEdited.current) return;
		const timer = setTimeout(async () => {
			const meta = await fetchUrlMetadata(url);
			if (meta.title && !titleManuallyEdited.current) {
				setTitle(meta.title);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [url]);

	const reset = useCallback((opts: UseBookmarkFormOptions = {}) => {
		setUrl(opts.initialUrl ?? '');
		setTitle(opts.initialTitle ?? '');
		setSelectedTagIds(opts.initialTagIds ?? []);
		setSelectedFolderId(opts.initialFolderId);
		titleManuallyEdited.current = false;
		originalUrl.current = opts.initialUrl ?? '';
	}, []);

	function handleUrlChange(newUrl: string) {
		setUrl(newUrl);
		titleManuallyEdited.current = false;
	}

	function handleTitleChange(newTitle: string, isManual: boolean) {
		setTitle(newTitle);
		if (isManual) titleManuallyEdited.current = true;
	}

	function handleTagToggle(id: string) {
		setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
	}

	return {
		url,
		title,
		selectedTagIds,
		selectedFolderId,
		setSelectedFolderId,
		handleUrlChange,
		handleTitleChange,
		handleTagToggle,
		reset,
	};
}
