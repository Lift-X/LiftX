const content = ['./client/**/*.{html,js,svelte,ts}'];

const config = {
	content: content,
	theme: {
		extend: {}
	},
	plugins: [require('daisyui')],
};

module.exports = config;
