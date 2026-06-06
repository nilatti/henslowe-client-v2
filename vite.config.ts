import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter(), react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/auth/google_oauth2": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["e2e/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
