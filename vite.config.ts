import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_PROXY_TARGET = "https://cricketchief.com";

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        onwarn(warning, warn) {
          const isDependencyUseClientWarning =
            warning.code === "MODULE_LEVEL_DIRECTIVE" &&
            warning.message.includes('"use client"') &&
            warning.message.includes("node_modules");

          if (isDependencyUseClientWarning) {
            return;
          }

          warn(warning);
        },
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "antd-vendor": ["antd", "@ant-design/icons"],
            "query-vendor": ["@tanstack/react-query"],
            "dnd-vendor": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          },
        },
      },
    },
  };
});
