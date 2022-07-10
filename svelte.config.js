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
			assets: 'public',
			hooks: 'client/hooks',
			lib: 'client/lib',
			params: 'client/params',
			routes: 'client/routes',
			serviceWorker: 'client/service-worker',
			template: 'client/app.html'
		},
		inlineStyleThreshold: 300,
		floc: false,
		csp: {
			mode: 'auto',
			directives: {
				'default-src': undefined
				// ...
			}
		},
		outDir: '.svelte-kit',
		paths: {
			assets: '',
			base: ''
		},
		prerender: {
			concurrency: 1,
			crawl: true,
			default: true,
			enabled: true,
			entries: ['*'],
			onError: 'fail'
		},
		routes: (filepath) => !/(?:(?:^_|\/_)|(?:^\.|\/\.)(?!well-known))/.test(filepath),
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},
		trailingSlash: 'never',
		version: {
			name: Date.now().toString(),
			pollInterval: 0
		},
		vite: () => ({
			fs: {
				allow: ["./svlete-kit/**/*"]
			}
		})
	},

	preprocess: [
		preprocess({
			postcss: true
		})
	]
};

export default config;
