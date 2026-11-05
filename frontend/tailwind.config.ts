import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sb: {
          canvas: "#0A0D14",
          header: "#0E131D",
          panel: "#121723",
          surface: "#161D2B",
          hover: "#1C2536",
          odds: "#1E273B",
          "odds-hover": "#27334D",
          border: "#222C40",
          "border-light": "#2D3A54",
          blue: "#2563EB",
          "blue-hover": "#1D4ED8",
          "blue-light": "#3B82F6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
