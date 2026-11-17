import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Minimalist White & Brown Palette ────────────────────────────
        brand: {
          50:  "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#a67c52", // Main coffee brown
          600: "#8c6239",
          700: "#734f2f",
          800: "#5a3d25",
          900: "#402b1a",
          950: "#261a10",
        },
        gray: {
          50:  "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#d2bab0",
          400: "#a67c52",
          500: "#8c6239",
          600: "#734f2f",
          700: "#5a3d25",
          800: "#402b1a",
          900: "#261a10", // Darkest brown replaces black/gray-900
          950: "#1a110a",
        },
        surface: {
          DEFAULT: "#ffffff",
          card:    "#fdf8f6",
          border:  "#eaddd7",
          muted:   "#f2e8e5",
          hover:   "#f2e8e5",
          foreground: "#261a10",
        },
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "radial-gradient(circle at top right, rgba(166,124,82,0.08), transparent 60%), " +
          "radial-gradient(circle at bottom left, rgba(140,98,57,0.05), transparent 60%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(253,248,246,1) 100%)",
      },
      boxShadow: {
        "glow-brand":   "0 4px 14px 0 rgba(166, 124, 82, 0.2)",
        "card":         "0 1px 3px 0 rgba(64, 43, 26, 0.05), 0 1px 2px -1px rgba(64, 43, 26, 0.05)",
        "card-hover":   "0 10px 15px -3px rgba(64, 43, 26, 0.1), 0 4px 6px -4px rgba(64, 43, 26, 0.05)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-up":      "fadeUp 0.6s ease forwards",
        "fade-in":      "fadeIn 0.4s ease forwards",
        "float":        "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
