import { defineConfig } from "vite"

export default defineConfig({
    build: {
        ssr: true,
        outDir:"./dist",
        target: "ESNext",
        rollupOptions: {
            input: "src/index.ts",
            output: { entryFileNames: "server.js" }
        }
    }
})