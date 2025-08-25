import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/dotdashdot_morsecode_translator/',   
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: true }
});
