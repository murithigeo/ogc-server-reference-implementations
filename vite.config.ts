import path from "node:path";
import { defineConfig } from "vite";
import process from "node:process";
const filename = "server.ts";

export default defineConfig({
  assetsInclude:["./data/fapar/*.tif"],
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
    outDir: ".",
    target: "ESNext",
    lib: {
      entry: filename,
      formats: ["es"],
    },
    rollupOptions: {
      input: filename,
      output: { entryFileNames: "app.js" },
    },
  }
});
