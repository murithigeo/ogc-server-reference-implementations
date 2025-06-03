import { defineConfig } from "vite"

export default defineConfig({
    build: {
        ssr: true,
        outDir: "build",
        target: "ESNext",
        rollupOptions: {
            input: "src/index.ts",
            output: { entryFileNames: "index.js" }
        }
    }
})