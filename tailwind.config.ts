import type { Config } from "tailwindcss";

const spacing = Object.fromEntries(
  [
    0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20,
    24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96,
  ].map((value) => [
    String(value),
    value === 0 ? "0" : `${Number((value * 0.4).toFixed(2))}rem`,
  ]),
);
const color = (name: string) => `var(--${name})`;

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    spacing,
    screens: {
      sm: "40rem",
      md: "48rem",
      lg: "64rem",
      xl: "80rem",
      "2xl": "96rem",
    },
    fontSize: {
      xs: ["1.2rem", "1.5"],
      sm: ["1.4rem", "1.5"],
      base: ["1.6rem", "1.55"],
      lg: ["1.8rem", "1.5"],
      xl: ["2rem", "1.4"],
      "2xl": ["2.4rem", "1.35"],
      "3xl": ["3rem", "1.25"],
      "4xl": ["3.6rem", "1.2"],
      "5xl": ["4.8rem", "1.1"],
    },
    borderWidth: {
      DEFAULT: "0.1rem",
      0: "0",
      2: "0.2rem",
      4: "0.4rem",
      8: "0.8rem",
    },
    borderRadius: {
      none: "0",
      sm: "0.4rem",
      DEFAULT: "0.6rem",
      md: "0.6rem",
      lg: "0.8rem",
      xl: "1.2rem",
      "2xl": "1.6rem",
      "3xl": "2.4rem",
      full: "999rem",
    },
    extend: {
      fontFamily: {
        sans: ["Figtree", "sans-serif"],
        heading: ["Sora", "sans-serif"],
      },
      colors: {
        background: color("background"),
        surface: {
          DEFAULT: color("surface"),
          muted: color("surface-muted"),
          hover: color("surface-hover"),
        },
        foreground: color("foreground"),
        muted: color("muted"),
        subtle: color("subtle"),
        border: { DEFAULT: color("border"), strong: color("border-strong") },
        primary: {
          DEFAULT: color("primary"),
          hover: color("primary-hover"),
          ink: color("primary-ink"),
          soft: color("primary-soft"),
          border: color("primary-border"),
        },
        success: { DEFAULT: color("success"), soft: color("success-soft") },
        warning: { DEFAULT: color("warning"), soft: color("warning-soft") },
        danger: { DEFAULT: color("danger"), soft: color("danger-soft") },
        focus: color("focus"),
      },
      boxShadow: {
        sm: "0 0.2rem 0.8rem rgb(24 27 54 / 0.05)",
        DEFAULT: "0 0.8rem 3.2rem rgb(24 27 54 / 0.04)",
        md: "0 0.8rem 3.2rem rgb(24 27 54 / 0.04)",
        lg: "0 2.4rem 10rem rgb(10 12 35 / 0.22)",
      },
      outlineWidth: { 1: "0.1rem", 2: "0.2rem", 3: "0.3rem" },
      ringWidth: { DEFAULT: "0.3rem", 1: "0.1rem", 2: "0.2rem", 4: "0.4rem" },
      keyframes: {
        appear: {
          from: { opacity: "0", transform: "translateY(0.6rem)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { appear: "appear 150ms ease-out" },
    },
  },
  plugins: [],
} satisfies Config;
