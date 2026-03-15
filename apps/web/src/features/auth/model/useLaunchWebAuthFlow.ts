import { ApiAdapter, setAuthToken } from '@repo/api-client';
import { useState } from 'react';
import { migrateLocalToApi, useStorageContext } from '@/shared/lib/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function useLaunchWebAuthFlow() {
	const { switchToApi } = useStorageContext();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function launch() {
		setIsPending(true);
		setError(null);

		try {
			const redirectUri = chrome.identity.getRedirectURL();
			const oauthUrl =
				'https://accounts.google.com/o/oauth2/v2/auth?' +
				`client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
				`&redirect_uri=${encodeURIComponent(redirectUri)}` +
				'&response_type=code' +
				`&scope=${encodeURIComponent('email profile')}` +
				'&access_type=offline' +
				'&prompt=consent';

			const responseUrl = await new Promise<string>((resolve, reject) => {
				chrome.identity.launchWebAuthFlow({ url: oauthUrl, interactive: true }, (url) => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else if (!url) {
						reject(new Error('No response URL'));
					} else {
						resolve(url);
					}
				});
			});

			const code = new URL(responseUrl).searchParams.get('code');
			if (!code) throw new Error('No auth code in response');

			const res = await fetch(`${API_URL}/auth/google/exchange`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, redirectUri }),
			});

			if (!res.ok) throw new Error('Token exchange failed');

			const { token } = (await res.json()) as { token: string };
			localStorage.setItem('auth_token', token);
			setAuthToken(token);

			const apiAdapter = new ApiAdapter();
			await migrateLocalToApi(apiAdapter).catch(() => {
				// migration failure is non-fatal
			});

			switchToApi();
		} catch (e) {
			setError(e instanceof Error ? e.message : '로그인에 실패했습니다');
		} finally {
			setIsPending(false);
		}
	}

	return { launch, isPending, error };
}
