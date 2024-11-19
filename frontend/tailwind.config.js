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
				pry: '#A56377',
			},
			spacing: {
				'1280': '1280px',
			},
			fontSize: {
				'10': '10px',
				'18': '18px',
				'28': '28px',
				'40': '40px',
			},
			borderRadius: {
				10: '10px',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}

