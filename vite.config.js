import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base on build so the bundle works from any path —
// including a GitHub Pages project subpath (/Travel-thru/).
// This is safe because the app is a single page with no client-side routing.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react(), tailwindcss()],
}))
