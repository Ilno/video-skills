import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const adminUi = process.env.ADMIN_UI
const out = process.env.OUT_DIR

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@\//, replacement: `${path.join(adminUi, "src")}/` }],
    dedupe: ["react", "react-dom"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: out,
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    cssCodeSplit: false,
    lib: {
      entry: path.join(import.meta.dirname, "app.ts"),
      formats: ["es"],
      fileName: () => "hublead-app.js",
      cssFileName: "hublead-app",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "react/jsx-dev-runtime"],
      output: { codeSplitting: false },
    },
  },
})
