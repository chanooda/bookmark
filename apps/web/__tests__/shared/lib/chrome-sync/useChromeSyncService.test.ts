import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChromeSyncService } from '@/shared/lib/chrome-sync/ChromeSyncService';
import { useChromeSyncService } from '@/shared/lib/chrome-sync/useChromeSyncService';

beforeEach(() => {
	vi.unstubAllGlobals();
});

describe('useChromeSyncService', () => {
	it('syncMode가 off이면 null을 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result } = renderHook(() => useChromeSyncService('off'));
		expect(result.current).toBeNull();
	});

	it('syncMode가 chrome-to-web이면 null을 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result } = renderHook(() => useChromeSyncService('chrome-to-web'));
		expect(result.current).toBeNull();
	});

	it('chrome 전역이 없으면 null을 반환한다', () => {
		// vi.unstubAllGlobals() 이후 chrome이 undefined인 환경
		const { result } = renderHook(() => useChromeSyncService('web-to-chrome'));
		expect(result.current).toBeNull();
	});

	it('chrome.bookmarks가 없으면 null을 반환한다', () => {
		vi.stubGlobal('chrome', {}); // bookmarks 프로퍼티 없음
		const { result } = renderHook(() => useChromeSyncService('web-to-chrome'));
		expect(result.current).toBeNull();
	});

	it('syncMode=web-to-chrome이고 chrome.bookmarks가 있으면 ChromeSyncService 인스턴스를 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result } = renderHook(() => useChromeSyncService('web-to-chrome'));
		expect(result.current).toBeInstanceOf(ChromeSyncService);
	});

	it('syncMode=bidirectional이고 chrome.bookmarks가 있으면 ChromeSyncService 인스턴스를 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result } = renderHook(() => useChromeSyncService('bidirectional'));
		expect(result.current).toBeInstanceOf(ChromeSyncService);
	});

	it('리렌더링 시 동일한 ChromeSyncService 인스턴스를 유지한다(ref 안정성)', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result, rerender } = renderHook(
			({ mode }: { mode: 'web-to-chrome' | 'off' }) => useChromeSyncService(mode),
			{ initialProps: { mode: 'web-to-chrome' as const } },
		);
		const first = result.current;
		rerender({ mode: 'web-to-chrome' });
		expect(result.current).toBe(first);
	});

	it('web-to-chrome → off로 변경되면 null을 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result, rerender } = renderHook(
			({ mode }: { mode: 'web-to-chrome' | 'off' }) => useChromeSyncService(mode),
			{ initialProps: { mode: 'web-to-chrome' as const } },
		);
		expect(result.current).toBeInstanceOf(ChromeSyncService);

		rerender({ mode: 'off' });
		expect(result.current).toBeNull();
	});

	it('off → web-to-chrome으로 변경되면 ChromeSyncService 인스턴스를 반환한다', () => {
		vi.stubGlobal('chrome', { bookmarks: {} });
		const { result, rerender } = renderHook(
			({ mode }: { mode: 'web-to-chrome' | 'off' }) => useChromeSyncService(mode),
			{ initialProps: { mode: 'off' as const } },
		);
		expect(result.current).toBeNull();

		rerender({ mode: 'web-to-chrome' });
		expect(result.current).toBeInstanceOf(ChromeSyncService);
	});
});
