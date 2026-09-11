/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cool neutral slate — professional dark SaaS surface scale (Linear/Stripe-style),
        // not warm, not pure black.
        ink: {
          950: "#0a0c10",
          900: "#0e1116",
          800: "#12161c",
          700: "#181d25",
          600: "#1f2530",
          500: "#28303c",
        },
        // Single brand accent: blue → indigo. Restrained, cool, corporate — kept the
        // "neon" key names so every component already using bg-neon-grad /
        // text-neon-cyan / etc. re-themes automatically from just these hex values.
        neon: {
          cyan: "#3b82f6", // blue-500 (primary)
          blue: "#6366f1", // indigo-500 (gradient partner)
          teal: "#0ea5e9", // sky-500 — ScoreRing "great" tier
          lime: "#10b981", // emerald-500 — success / available
          magenta: "#f43f5e", // rose-500 — alerts / danger
        },
        line: "rgba(255,255,255,0.05)",
      },
      fontFamily: {
        display: ['"Clash Display"', "Sora", "sans-serif"],
        sans: ['"Geist"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', '"JetBrains Mono"', "monospace"],
      },
      backgroundImage: {
        // Blue → indigo only
        "neon-grad": "linear-gradient(110deg,#3b82f6 0%,#6366f1 100%)",
        "neon-soft": "linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.06))",
        // Very subtle dot grid
        grid: "radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.1), 0 0 24px -4px rgba(99,102,241,0.2)",
        "glow-sm": "0 0 0 1px rgba(59,130,246,0.08), 0 0 16px -6px rgba(99,102,241,0.15)",
        "glow-blue": "0 0 0 1px rgba(99,102,241,0.12), 0 0 32px -8px rgba(99,102,241,0.25)",
        card: "0 1px 0 rgba(255,255,255,0.02) inset, 0 20px 60px -20px rgba(0,0,0,1)",
        "card-hover": "0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 80px -16px rgba(0,0,0,1)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.35)" },
          "70%": { boxShadow: "0 0 0 8px rgba(99,102,241,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s ease forwards",
        "pulse-ring": "pulse-ring 2.4s infinite",
      },
    },
  },
  plugins: [],
};
