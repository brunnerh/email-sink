import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'node:path';
import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';
import { fontsDownloadPlugin } from './src/vite/fonts-download-plugin';

export default defineConfig((config) => ({
	plugins: [
		tailwindcss(),
		fontsDownloadPlugin({
			cacheDirectoryPath: path.resolve(__dirname, '.fonts'),
		}),
		sveltekit(),
		devtoolsJson(),
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
}));
