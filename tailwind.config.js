/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#006A4E", // Bangladesh Green
                secondary: "#F42A41", // Bangladesh Red
                accent: "#FFD700",
                dark: "#1A1A1A",
                light: "#F5F5F5"
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
