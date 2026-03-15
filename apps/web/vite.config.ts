import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
	plugins: [react(), tailwindcss()],
	// extension 모드에서는 상대 경로를 사용해야 chrome-extension:// 프로토콜에서 assets이 정상 로드됨
	base: mode === 'extension' ? './' : '/',
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
}));
