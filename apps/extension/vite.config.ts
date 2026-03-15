import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

/**
 * web 앱의 extension 빌드 결과물을 dist/newtab/ 에 복사하는 Vite 플러그인.
 * 반드시 @repo/web의 build:ext 가 먼저 실행되어야 합니다 (turbo 파이프라인으로 보장).
 */
function copyNewtabPlugin(): Plugin {
	return {
		name: 'copy-newtab',
		closeBundle() {
			const webDist = resolve(__dirname, '../web/dist');
			const newtabDest = resolve(__dirname, 'dist/newtab');

			if (!existsSync(webDist)) {
				console.warn(
					'[copy-newtab] apps/web/dist 가 없습니다. pnpm --filter @repo/web build:ext 를 먼저 실행하세요.',
				);
				return;
			}

			cpSync(webDist, newtabDest, { recursive: true });
			console.log('[copy-newtab] web 빌드 결과물을 dist/newtab/ 에 복사 완료');
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss(), copyNewtabPlugin()],
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	build: {
		rollupOptions: {
			input: {
				popup: resolve(__dirname, 'popup.html'),
			},
		},
	},
});
