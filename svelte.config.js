import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		files: {
			hooks: 'client/hooks',
			lib: 'client/lib',
			params: 'client/params',
			routes: 'client/routes',
			serviceWorker: 'client/service-worker',
			appTemplate: 'client/app.html'
		},
		inlineStyleThreshold: 300,
		outDir: '.svelte-kit',
	},
	preprocess: [
		preprocess({
			postcss: true
		})
	]
};

export default config;
