const content = ['./client/**/*.{html,js,svelte,ts}'];

const config = {
	content: content,
	theme: {
		extend: {
			colors: {
				primary: '#a50b00',
				'black': {
					100: '#cfcfcf',
					200: '#a0a0a0',
					300: '#707070',
					400: '#414141',
					500: '#111111',
					600: '#0e0e0e',
					700: '#0a0a0a',
					800: '#070707',
					900: '#030303'
				}
			}
		}
	},
	plugins: [require('daisyui')]
};

module.exports = config;
