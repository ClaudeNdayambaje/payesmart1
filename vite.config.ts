import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Détection de l'environnement Netlify
const isNetlify = process.env.NETLIFY === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: isNetlify ? false : true, // Désactiver les sourcemaps en production pour Netlify
    minify: isNetlify ? 'esbuild' : false, // Utiliser esbuild minifier pour Netlify, désactiver en dev
    rollupOptions: {
      external: ['axios'], // Ajouter axios aux dépendances externes comme recommandé par Netlify
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  optimizeDeps: {
    force: true
  },
  // Gestion des erreurs de compilation - ignorer les avertissements
  define: {
    'process.env.NODE_ENV': JSON.stringify(isNetlify ? 'production' : 'development')
  }
});
