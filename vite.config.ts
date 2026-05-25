import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers'
import { defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  build: {
    assetsInlineLimit: 16384, // 16 KB
    outDir: 'docs',
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [
    vue(),
    Components({
      dirs: [],
      dts: 'src/components.d.ts',
      directives: true,
      resolvers: [BootstrapVueNextResolver()],
    }),
  ],
  resolve: {
    alias: [{ find: '@', replacement: '/src' }],
  },
  test: {
    includeSource: ['src/**/*.{js,ts}'],
  },
})
