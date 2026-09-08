import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { watch: { ignored: ['**/cms/**'] } },
  test: { exclude: ['**/node_modules/**', '**/dist/**', 'cms/**'] },
});
