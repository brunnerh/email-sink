import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { optimizeImports } from 'carbon-preprocess-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({ script: true }), optimizeImports()],
	vitePlugin: {
		inspector: true,
	},
	kit: { adapter: adapter() },
};

export default config;
