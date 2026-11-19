import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { healthAiGateway } from "./server/health-ai.ts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), healthAiGateway()],
  optimizeDeps: {
    include: ["lucide-react", "framer-motion", "recharts"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "recharts"],
          ui: ["lucide-react", "framer-motion"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
