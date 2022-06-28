const content = ['./client/**/*.{html,js,svelte,ts}'];

const config = {
	content: content,
	theme: {
		extend: {
			colors: {
				primary: '#a50b00'
			}
		}
	},
	plugins: [require('daisyui')],
};

module.exports = config;
