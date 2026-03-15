export function stripProtocol(url: string) {
	return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

export function getFaviconUrl(url: string): string | null {
	try {
		const { hostname } = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
	} catch {
		return null;
	}
}
