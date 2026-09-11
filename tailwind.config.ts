import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kemnaker: {
          navy: "#003399",
          darkNavy: "#002266",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
