import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Memuat semua variabel .env (termasuk yang tidak ber-prefix VITE_)
  const env = loadEnv(mode, process.cwd(), '');

  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // Aktifkan baris ini jika backend pakai HTTPS self-signed:
          // secure: false,
        },
      },
    },
  };
});