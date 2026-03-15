import { apiClient } from '@repo/api-client';
import type { UrlMetadata } from '@repo/types';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	try {
		const res = await apiClient.get<UrlMetadata>('/metadata', { params: { url } });
		return res.data;
	} catch {
		return { title: null, favicon: null };
	}
}
