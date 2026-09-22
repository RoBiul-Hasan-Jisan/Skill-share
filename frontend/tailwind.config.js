/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Graphite" — warm-neutral dark scale. Not blue-black, not pure black.
        ink: {
          950: "#14161A",
          900: "#191C21",
          800: "#20242B",
          700: "#282D36",
          600: "#333944",
          500: "#454C58",
        },
        // Single accent — a brass/ochre "grading pen," kept the old key names
        // (cyan/blue/lime/magenta) so every component that already reads
        // bg-neon-grad / text-neon-cyan / etc. re-themes from these hex values.
        neon: {
          cyan: "#C8862E",   // brass (primary accent)
          blue: "#A66A22",   // deeper brass (gradient partner)
          teal: "#8A9A7E",   // sage — secondary data accent
          lime: "#55805F",   // moss — success / available
          magenta: "#A8503D", // rust — alerts / danger
        },
        line: "rgba(255,255,255,0.08)",
        paper: {
          DEFAULT: "#EEEDE8",
          card: "#F7F6F2",
          line: "rgba(20,22,26,0.10)",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', "monospace"],
      },
      // Tighter, purposeful scale — replaces the "rounded-xl on every
      // surface" default with something closer to a printed card/ticket.
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "5px",
        xl: "6px",
        "2xl": "8px",
        "3xl": "10px",
        full: "9999px",
      },
      backgroundImage: {
        "neon-grad": "linear-gradient(110deg,#C8862E 0%,#A66A22 100%)",
        "neon-soft": "linear-gradient(135deg,rgba(200,134,46,0.10),rgba(166,106,34,0.06))",
        grid: "radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)",
      },
      boxShadow: {
        // Flat, printed-card shadow — a short hard offset, not a soft blur halo.
        glow: "2px 2px 0 0 rgba(200,134,46,0.35)",
        "glow-sm": "1px 1px 0 0 rgba(200,134,46,0.3)",
        "glow-blue": "2px 2px 0 0 rgba(166,106,34,0.35)",
        card: "0 1px 0 rgba(255,255,255,0.02) inset, 3px 3px 0 0 rgba(0,0,0,0.5)",
        "card-hover": "0 1px 0 rgba(255,255,255,0.03) inset, 4px 4px 0 0 rgba(0,0,0,0.55)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(200,134,46,0.35)" },
          "70%": { boxShadow: "0 0 0 8px rgba(200,134,46,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(200,134,46,0)" },
        },
        // One deliberate moment: a stamp/punch — used on connection-accept,
        // team-created, etc. Not applied to routine hover states.
        stamp: {
          "0%": { transform: "scale(1.4) rotate(-8deg)", opacity: "0" },
          "60%": { transform: "scale(0.94) rotate(-8deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.6s infinite",
        "fade-up": "fade-up 0.5s ease forwards",
        "pulse-ring": "pulse-ring 2.4s infinite",
        stamp: "stamp 0.4s cubic-bezier(.2,.9,.3,1.1) forwards",
      },
    },
  },
  plugins: [],
};
