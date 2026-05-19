import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    // Evita source maps incompletos de dependências (ex.: vue) que geram "No sources are declared"
    sourcemap: false,
    esbuildOptions: {
      sourcemap: false,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 8000,
    host: '0.0.0.0', // Escutar em todas as interfaces para acesso na rede local
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Habilitar sourcemaps para debug em produção
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
})
