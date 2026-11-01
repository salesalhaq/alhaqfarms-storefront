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
        bg: "rgb(var(--canvas) / <alpha-value>)",
        "bg-elevated": "rgb(var(--surface) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        text: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        border: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        primary: "rgb(var(--accent) / <alpha-value>)",
        "primary-deep": "rgb(var(--primary-deep) / <alpha-value>)",
        gold: "rgb(var(--accent2) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        "on-accent": "rgb(var(--on-accent) / <alpha-value>)",
      },
      boxShadow: {
        glass: "0 8px 32px rgb(0 0 0 / 0.45)",
        "glass-lift": "0 16px 44px rgb(0 0 0 / 0.5)",
        "glow-crimson": "0 0 40px rgb(193 18 31 / 0.25)",
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
          "100%": { transform: "translate3d(4vw, -3vh, 0) scale(1.1)" },
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
