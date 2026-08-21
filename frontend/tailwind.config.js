/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
        },
        border: "var(--border-color)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },
        accent: {
          blue: "var(--accent-blue)",
          amber: "var(--accent-amber)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px var(--accent-glow)",
        card: "0 8px 32px rgba(0,0,0,0.08)",
        "card-dark": "0 8px 32px rgba(0,0,0,0.5)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.6, transform: "scale(1.15)" },
        },
        drive: {
          "0%": { transform: "translateX(-8px)" },
          "50%": { transform: "translateX(8px)" },
          "100%": { transform: "translateX(-8px)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        drive: "drive 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
