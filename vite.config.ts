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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          graphql: ["graphql", "graphql-request"],
          dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          ui: [
            "@tanstack/react-query",
            "lucide-react",
            "react-hook-form",
            "@hookform/resolvers",
            "zod",
          ],
        },
      },
    },
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
