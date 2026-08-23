import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { imagetools } from 'vite-imagetools'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    imagetools(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
