import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'global': "rollup-plugin-node-polyfills/polyfills/global",
      "@": path.resolve("src"),
      "@widgets": path.resolve("src/widgets"),
      "@features": path.resolve("src/features"),
      "@entities": path.resolve("src/entities"),
      buffer: "buffer/", 
    },
  },
  define: {
    global: "rollup-plugin-node-polyfills/polyfills/global",
  },
  optimizeDeps: {
    include: [
      "buffer",
      "eth-query",
      "json-rpc-random-id",
    ],
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), 
      ],
    },
  },
});