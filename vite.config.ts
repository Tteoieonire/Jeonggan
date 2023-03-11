import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsInlineLimit: 16384, // 16 KB
    outDir: 'docs',
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [vue()],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  test: {
    includeSource: ['src/**/*.{js,ts}'],
  },
})
