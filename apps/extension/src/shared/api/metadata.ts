import type { UrlMetadata } from '@repo/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	try {
		const res = await fetch(`${API_URL}/metadata?url=${encodeURIComponent(url)}`);
		if (!res.ok) return { title: null, favicon: null };
		return res.json() as Promise<UrlMetadata>;
	} catch {
		return { title: null, favicon: null };
	}
}
