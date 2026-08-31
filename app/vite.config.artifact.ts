import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// A separate, single-file production build used only to publish this app
// as a self-contained Artifact preview (npm run build:artifact). The
// regular `npm run build` / `npm run dev` are unaffected.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    assetsInlineLimit: 100 * 1024 * 1024,
    cssCodeSplit: false,
  },
})
