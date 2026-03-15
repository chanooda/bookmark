import type { SyncMode } from '@repo/types';
import { useRef } from 'react';
import { ChromeSyncService } from './ChromeSyncService';

export function useChromeSyncService(syncMode: SyncMode): ChromeSyncService | null {
	const serviceRef = useRef<ChromeSyncService | null>(null);

	const isAvailable =
		(syncMode === 'web-to-chrome' || syncMode === 'bidirectional') &&
		typeof chrome !== 'undefined' &&
		!!chrome.bookmarks;

	if (isAvailable && !serviceRef.current) {
		serviceRef.current = new ChromeSyncService();
	} else if (!isAvailable) {
		serviceRef.current = null;
	}

	return serviceRef.current;
}
