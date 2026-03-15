import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../apps/extension/public/icons');
mkdirSync(outDir, { recursive: true });

// 헤더 로고와 동일한 북마크 SVG 패스
function makeSvg(size) {
	return Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5" fill="#6366f1"/>
  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" fill="white"/>
</svg>`,
	);
}

for (const size of [16, 48, 128]) {
	await sharp(makeSvg(size))
		.resize(size, size)
		.png()
		.toFile(resolve(outDir, `icon${size}.png`));
	console.log(`✓ icon${size}.png`);
}
