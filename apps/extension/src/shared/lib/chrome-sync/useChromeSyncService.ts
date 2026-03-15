import { useRef } from 'react';
import { ChromeSyncService } from './ChromeSyncService';

export function useChromeSyncService(syncEnabled: boolean): ChromeSyncService | null {
	const serviceRef = useRef<ChromeSyncService | null>(null);

	const isAvailable = syncEnabled && typeof chrome !== 'undefined' && !!chrome.bookmarks;

	if (isAvailable && !serviceRef.current) {
		serviceRef.current = new ChromeSyncService();
	} else if (!isAvailable) {
		serviceRef.current = null;
	}

	return serviceRef.current;
}
