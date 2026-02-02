import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    // Forces Vite to use only one instance of these core libraries
    // This is the primary fix for "Identifier already declared" errors
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    // Forces Vite to pre-bundle these during cold start
    // This prevents "double-injection" of HMR queries
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
      },
      "/auth": {
        target: "http://localhost:5192",
        changeOrigin: true,
      },
    },
  },
});