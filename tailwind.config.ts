import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        "on-accent": "rgb(var(--on-accent) / <alpha-value>)",
      },
      borderRadius: {
        glass: "var(--radius)",
        "glass-sm": "var(--radius-sm)",
        "glass-lg": "var(--radius-lg)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "33%": { transform: "translate3d(6vw, -4vh, 0) scale(1.12)" },
          "66%": { transform: "translate3d(-5vw, 5vh, 0) scale(0.94)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        rise: {
          from: { transform: "translateY(110%)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        drift: "drift 28s ease-in-out infinite",
        "drift-slow": "drift 42s ease-in-out infinite",
        shimmer: "shimmer 1.7s infinite",
        rise: "rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both",
        floaty: "floaty 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
