import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  server: {
    port: 5173,
    open: false
  },
  plugins: [
    VitePWA({
      // 'generateSW': el plugin genera el Service Worker y calcula el
      // precache de los archivos de build (con hash) automáticamente.
      // No mantenemos esa lista a mano porque cambia en cada build.
      strategies: 'generateSW',
      registerType: 'prompt', // el propio código en src/main.js controla el registro
      injectRegister: false,
      manifest: {
        name: 'SUC/112 - Apoyo a Decisión Coordinación',
        short_name: 'SUC/112 Coord',
        description:
          'Prototipo de consulta rápida para coordinación sanitaria de emergencias — guías clínicas, criterios de activación y directorio de centros.',
        start_url: './index.html',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F5F7FA',
        // [PLACEHOLDER] Color institucional — sustituir por el oficial del SUC
        theme_color: '#0B3D91',
        lang: 'es',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Precachea el "app shell": HTML/JS/CSS/iconos generados por el build.
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            // Módulos OFFLINE (guías, criterios): network-first con caché de
            // respaldo — intenta traer lo último, si no hay red usa lo cacheado.
            urlPattern: ({ url }) =>
              url.pathname.endsWith('/data/guias.json') || url.pathname.endsWith('/data/criterios.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'offline-modules-data',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
          // Los módulos ONLINE (directorio, documentacion) se dejan fuera a
          // propósito: sin regla de caché, el Service Worker no intercepta
          // esas peticiones y fallan limpiamente sin conexión, tal como
          // se decidió en la arquitectura (sección 4 del brief).
        ]
      },
      devOptions: {
        // Activado para poder probar el comportamiento offline con
        // "npm run dev", no solo con la build de producción.
        enabled: true,
        type: 'module'
      }
    })
  ]
});
