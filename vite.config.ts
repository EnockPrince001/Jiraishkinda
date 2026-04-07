import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "lucide-react"
    ],
  },
  server: {
    port: 8080,
    host: true,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5080",
        changeOrigin: true,
      }
    },
  },
});