import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './client',
  build: {
    minify: false,
  },
  ssr: {
    format: 'cjs',
  },
});
