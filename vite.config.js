import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Not VITE_-prefixed on purpose: NVIDIA_API_KEY stays on the server and is never bundled.
  const env = loadEnv(mode, process.cwd(), '');
  const nim = {
    '/nim': {
      target: env.NIM_UPSTREAM || 'https://integrate.api.nvidia.com',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/nim/, ''),
      configure: (proxy) => proxy.on('proxyReq', (req) => {
        if (env.NVIDIA_API_KEY) req.setHeader('Authorization', `Bearer ${env.NVIDIA_API_KEY}`);
        req.removeHeader('origin'); req.removeHeader('referer');
      }),
    },
  };
  return {
    plugins: [react()],
    server: { proxy: nim },
    preview: { proxy: nim },
    test: { environment: 'node', include: ['src/**/*.test.{js,jsx}'] },
  };
});
