import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		browser: {
			hydrate: true,
			router: false
		},
		files: {
			hooks: 'client/hooks',
			lib: 'client/lib',
			params: 'client/params',
			routes: 'client/routes',
			serviceWorker: 'client/service-worker',
			template: 'client/app.html'
		},
		inlineStyleThreshold: 300,
		csp: {
			mode: 'auto',
			directives: {
				'default-src': undefined
				// ...
			}
		},
		paths: {
			assets: '',
			base: '',
		},
		outDir: '.svelte-kit',
		prerender: {
			concurrency: 1,
			crawl: true,
			default: true,
			enabled: true,
			entries: ['*'],
			onError: 'fail'
		},
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},
		trailingSlash: 'never',
		version: {
			name: Date.now().toString(),
			pollInterval: 0
		},
	},
	preprocess: [
		preprocess({
			postcss: true
		})
	]
};

export default config;
