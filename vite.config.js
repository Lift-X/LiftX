import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	mode: 'production',
	fs: {
		allow: ['./svlete-kit/**/*', '/public/']
	},
	build: {
		minify: 'esbuild',
		cssCodeSplit: true
	},
	ssr: {
		noExternal: ['chart.js']
	},
	experimental: {
		useVitePreprocess: true
	},
};

export default config;
