import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2018',
    chunkSizeWarningLimit: 1500
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
