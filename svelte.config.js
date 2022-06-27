import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		browser: {
			hydrate: true,
			router: true
		},
		files: {
			assets: 'static',
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
		  package: {
			dir: 'package',
			emitTypes: true,
			// excludes all .d.ts and files starting with _ as the name
			exports: (filepath) => !/^_|\/_|\.d\.ts$/.test(filepath),
			files: () => true
		  },
		  paths: {
			assets: '',
			base: ''
		  },
		  prerender: {
			concurrency: 1,
			crawl: true,
			default: false,
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
		  vite: () => ({})
	}
};

export default config;
