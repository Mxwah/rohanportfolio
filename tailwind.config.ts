import type { Config } from "tailwindcss";

// Tokens live as CSS variables in src/styles/tokens.css.
// Tailwind just points at them so utility classes stay on-system.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--bg-raised)",
        card: "var(--bg-card)",
        ink: "var(--text)",
        "ink-2": "var(--text-secondary)",
        "ink-3": "var(--text-muted)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
      },
      fontFamily: {
        display: ["Schibsted Grotesk", "system-ui", "sans-serif"],
        sans: ["Schibsted Grotesk", "system-ui", "sans-serif"],
        mono: ["Spline Sans Mono", "ui-monospace", "monospace"],
      },
      maxWidth: {
        prose: "68ch",
        shell: "1240px",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
        inout: "cubic-bezier(0.65, 0, 0.35, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
