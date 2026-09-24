import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In development the React dev server proxies /api to the Node backend, so no CORS setup is needed.
  const apiTarget = env.VITE_DEV_API_PROXY || 'http://localhost:5100';
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api': { target: apiTarget, changeOrigin: true } } },
    build: { outDir: 'dist', sourcemap: false },
  };
});
