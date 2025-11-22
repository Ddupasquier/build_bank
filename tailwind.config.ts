import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#0f766e",
          600: "#115e59",
          700: "#134e4a"
        }
      }
    }
  },
  plugins: []
};

export default config;
