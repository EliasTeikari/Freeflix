import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#E50914",
          hover: "#F40612",
          dark: "#B20710",
        },
        dark: {
          DEFAULT: "#141414",
          lighter: "#1F1F1F",
          card: "#181818",
          border: "#2F2F2F",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
