import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: process.env.NODE_ENV === 'production' ? '/SmashWeeeper/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          external: (id) => {
            return id.includes('multiplayer/server.ts') || 
                   id.includes('multiplayer/index.ts') ||
                   id.includes('multiplayer/lobbys.ts') ||
                   id.includes('multiplayer/sync.ts') ||
                   id.includes('multiplayer/socket.ts');
          }
        }
      }
    };
});
