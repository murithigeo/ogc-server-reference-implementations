import { defineConfig } from "vite"

export default defineConfig({
    build: {
        ssr: true,
        outDir: "./dist",
        target: "ESNext",
        lib: {
            entry: "src/index.ts",
            formats: ["es"]
        },
        rollupOptions: {
            input: "src/index.ts",
            output: { entryFileNames: "server.js" }
        }
    }
})