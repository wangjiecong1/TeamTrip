// Tailwind theme extension example for TeamTrip visual style.
// Merge this into your existing tailwind.config.ts theme.extend.
// This file is style-only and does not define any business features.

export const teamTripThemeExtend = {
  colors: {
    tt: {
      primary: "#00A889",
      "primary-600": "#07967E",
      "primary-700": "#087C6A",
      "primary-light": "#E6F7F4",
      "primary-soft": "#F0FBF8",

      blue: "#3B82F6",
      "blue-soft": "#EFF6FF",
      orange: "#F97316",
      "orange-soft": "#FFF7ED",
      red: "#EF4444",
      "red-soft": "#FEF2F2",
      green: "#22C55E",
      "green-soft": "#F0FDF4",
      purple: "#8B5CF6",
      "purple-soft": "#F5F3FF",

      text: {
        primary: "#102033",
        secondary: "#475569",
        tertiary: "#64748B",
        muted: "#94A3B8",
      },

      bg: {
        page: "#F7FAFC",
        card: "#FFFFFF",
        subtle: "#F8FAFC",
        muted: "#F1F5F9",
      },

      border: "#E2E8F0",
      "border-light": "#EEF2F6",
    },
  },
  borderRadius: {
    "tt-xs": "6px",
    "tt-sm": "8px",
    "tt-md": "12px",
    "tt-lg": "16px",
    "tt-xl": "20px",
    "tt-2xl": "24px",
    "tt-3xl": "28px",
  },
  boxShadow: {
    "tt-xs": "0 1px 2px rgba(15, 23, 42, 0.04)",
    "tt-sm": "0 4px 12px rgba(15, 23, 42, 0.06)",
    "tt-md": "0 10px 24px rgba(15, 23, 42, 0.08)",
    "tt-lg": "0 18px 42px rgba(15, 23, 42, 0.10)",
  },
  fontFamily: {
    tt: [
      "PingFang SC",
      "Microsoft YaHei",
      "Inter",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "sans-serif",
    ],
  },
};
