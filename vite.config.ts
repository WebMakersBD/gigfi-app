import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true
        },
        plugins: []
      }
    },
    resolve: {
      alias: {
        buffer: 'buffer/',
        process: 'process/browser',
      },
    },
    define: {
      'process.env': {
        THIRDWEB_CLIENT_ID: JSON.stringify(env.VITE_THIRDWEB_CLIENT_ID),
        THIRDWEB_API_KEY: JSON.stringify(env.VITE_THIRDWEB_API_KEY),
        VITE_MAINNET_RPC_URL: JSON.stringify(env.VITE_MAINNET_RPC_URL),
        VITE_MAINNET_WS_RPC_URL: JSON.stringify(env.VITE_MAINNET_WS_RPC_URL)
      },
      global: 'globalThis',
    },
    server: {
      hmr: {
        overlay: true
      },
      watch: {
        usePolling: true
      }
    },
    build: {
      target: 'esnext',
      sourcemap: true,
      rollupOptions: {
        external: [
          /node:.*/,
          /\.node$/
        ],
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'web3-vendor': ['viem', '@wagmi/core', 'wagmi'],
            'ui-vendor': ['lucide-react']
          }
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    }
  };
});