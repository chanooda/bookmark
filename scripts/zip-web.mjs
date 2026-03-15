import { createWriteStream, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../apps/web/dist');
const outZip = resolve(__dirname, '../web.zip');

if (!existsSync(distDir)) {
	console.error('apps/web/dist 가 없습니다. 먼저 빌드하세요.');
	process.exit(1);
}

if (existsSync(outZip)) rmSync(outZip);

const output = createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
archive.directory(distDir, false);

await archive.finalize();
console.log(`✓ web.zip 생성 완료 (${archive.pointer()} bytes)`);
