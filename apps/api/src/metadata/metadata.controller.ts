import { Controller, Get, Query } from '@nestjs/common';

@Controller('metadata')
export class MetadataController {
	@Get()
	async getMetadata(@Query('url') url: string) {
		if (!url) return { title: null, favicon: null };

		let hostname: string;
		try {
			hostname = new URL(url).hostname;
		} catch {
			return { title: null, favicon: null };
		}

		const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);
			const res = await fetch(url, {
				signal: controller.signal,
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkApp/1.0)' },
			});
			clearTimeout(timeoutId);

			const html = await res.text();
			const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
			const title = match ? match[1].trim() : null;

			return { title, favicon };
		} catch {
			return { title: null, favicon };
		}
	}
}
