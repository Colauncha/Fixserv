/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				pry: {
					DEFAULT: '#779BE7',
					accent: '#ECF1FC',
					light: '#A1B7F2'
				},
				black1: '#110000C2',
			},
			spacing: {
				'1280': '1280px',
			},
			fontSize: {
				'10': '10px',
				'18': '18px',
				'28': '28px',
				'40': '40px',
				'64': '64px',
			},
			borderRadius: {
				10: '10px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}

