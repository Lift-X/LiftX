import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
        plugins: [sveltekit()],
		mode: 'production',
		fs: {
			allow: ["./svlete-kit/**/*"]
		},
		build: {
			minify: 'esbuild',
			cssCodeSplit: true
		}
};

export default config