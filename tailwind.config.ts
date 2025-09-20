import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        cta: {
          DEFAULT: "hsl(var(--cta))",
          foreground: "hsl(var(--cta-foreground))",
        },

        // Royal Green Brand palette - OYO-inspired with Royal Green (#004225)
        coral: {
          25: "#F0F7F0",
          50: "#E8F5E8",
          100: "#C8E6C8",
          200: "#9BD29B",
          300: "#6BB86B",
          400: "#4A9F4A",
          500: "#004225", // Royal Green primary
          600: "#003A20",
          700: "#00321B",
          800: "#002A16",
          900: "#002211",
        },
        gray: {
          50: "#FAFAFA",
          100: "#F7F7F7",
          200: "#EBEBEB",
          300: "#DDDDDD",
          400: "#B0B0B0",
          500: "#717171", // Airbnb's medium gray
          600: "#484848",
          700: "#222222", // Airbnb's dark text
          800: "#1D1D1D",
          900: "#171717",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        // Airbnb uses Circular, fallback to Inter and system fonts
        sans: [
          "Inter",
          "SF Pro Display",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        heading: [
          "Inter",
          "SF Pro Display",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        body: [
          "Inter",
          "SF Pro Display",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // Airbnb's typography scale
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
      },
      spacing: {
        // Airbnb's spacing scale (8px base)
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      borderRadius: {
        lg: "0.5rem", // 8px - OYO's minimal border radius
        md: "0.375rem", // 6px
        sm: "0.25rem", // 4px
        xl: "0.625rem", // 10px
        "2xl": "0.75rem", // 12px - Maximum for OYO style
      },
      boxShadow: {
        // Airbnb's shadow system
        "airbnb-sm": "0 1px 2px rgba(0, 0, 0, 0.08)",
        airbnb: "0 6px 16px rgba(0, 0, 0, 0.12)",
        "airbnb-lg":
          "0 16px 32px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.1)",
        "airbnb-hover":
          "0 12px 28px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.1)",
        search: "0 16px 32px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(0, 0, 0, 0.1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "smooth-scale": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.03)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "smooth-scale": "smooth-scale 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
