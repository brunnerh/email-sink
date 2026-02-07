import adapter from '@sveltejs/adapter-vercel';
import { optimizeImports } from 'carbon-preprocess-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [optimizeImports()],
	vitePlugin: {
		inspector: true,
	},
	kit: { adapter: adapter() },
};

export default config;
