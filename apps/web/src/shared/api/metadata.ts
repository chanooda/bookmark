import { apiClient } from '@repo/api-client';
import type { UrlMetadata } from '@repo/types';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	// extension 빌드에서는 API 서버 없음 → 즉시 빈 값 반환
	if (import.meta.env.MODE === 'extension') return { title: null, favicon: null };

	try {
		const res = await apiClient.get<UrlMetadata>('/metadata', { params: { url } });
		return res.data;
	} catch {
		return { title: null, favicon: null };
	}
}
