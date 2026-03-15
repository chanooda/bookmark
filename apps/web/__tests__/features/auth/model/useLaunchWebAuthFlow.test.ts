import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLaunchWebAuthFlow } from '@/features/auth/model/useLaunchWebAuthFlow';

// chrome.identity 모킹
const mockLaunchWebAuthFlow = vi.fn();
const mockGetRedirectURL = vi.fn(() => 'https://ext-id.chromiumapp.org/');

vi.stubGlobal('chrome', {
	identity: {
		launchWebAuthFlow: mockLaunchWebAuthFlow,
		getRedirectURL: mockGetRedirectURL,
	},
	runtime: { lastError: null },
});

// fetch 모킹
global.fetch = vi.fn();

// StorageContext 모킹
vi.mock('@/shared/lib/storage', () => ({
	useStorageContext: () => ({ switchToApi: vi.fn() }),
	migrateLocalToApi: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@bookmark/api-client', () => ({
	ApiAdapter: vi.fn(),
	setAuthToken: vi.fn(),
}));

describe('useLaunchWebAuthFlow', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it('성공 시 토큰을 저장하고 switchToApi를 호출한다', async () => {
		// chrome.identity 성공 응답
		mockLaunchWebAuthFlow.mockImplementation((_opts, cb) =>
			cb('https://ext-id.chromiumapp.org/?code=auth_code_123'),
		);

		// 백엔드 응답 모킹
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: true,
			json: async () => ({ token: 'jwt_token_abc' }),
		});

		const { result } = renderHook(() => useLaunchWebAuthFlow());

		await act(async () => {
			await result.current.launch();
		});

		expect(localStorage.getItem('auth_token')).toBe('jwt_token_abc');
		expect(result.current.isPending).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it('chrome.identity 실패 시 error 상태를 설정한다', async () => {
		mockLaunchWebAuthFlow.mockImplementation((_opts, cb) => {
			Object.defineProperty(chrome.runtime, 'lastError', {
				value: { message: 'User cancelled' },
				configurable: true,
			});
			cb(undefined);
		});

		const { result } = renderHook(() => useLaunchWebAuthFlow());

		await act(async () => {
			await result.current.launch();
		});

		expect(result.current.error).toBeTruthy();
		expect(localStorage.getItem('auth_token')).toBeNull();
	});

	it('백엔드 토큰 교환 실패 시 error 상태를 설정한다', async () => {
		mockLaunchWebAuthFlow.mockImplementation((_opts, cb) =>
			cb('https://ext-id.chromiumapp.org/?code=auth_code_123'),
		);

		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
			ok: false,
		});

		const { result } = renderHook(() => useLaunchWebAuthFlow());

		await act(async () => {
			await result.current.launch();
		});

		expect(result.current.error).toBeTruthy();
	});
});
