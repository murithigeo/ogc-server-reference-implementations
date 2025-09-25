import path from "node:path";
import { defineConfig } from "vite";
import process from "node:process";
export default defineConfig({
  resolve: {
    alias: {
      "@template/utils": path.resolve(process.cwd(), "./utils"),
      "@template/edr": path.resolve(process.cwd(), "./edr"),
      "@template/features": path.resolve(process.cwd(), "./features"),
      "@template/data": path.resolve(process.cwd(), "./data"),
    },
  },
  build: {
    ssr: true,
    outDir: "api",
    target: "ESNext",
    lib: {
      entry: "app.ts",
      formats: ["es"],
    },
    rollupOptions: {
      input: "server.ts",
      output: { entryFileNames: "index.js" },
    },
  },
});
