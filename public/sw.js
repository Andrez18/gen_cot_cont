// Service worker mínimo de CotiFactura.
// Objetivo principal: cumplir el requisito de "instalabilidad" de Chrome/Android
// (manifest + íconos + HTTPS + service worker activo con handler de fetch)
// para que el navegador dispare `beforeinstallprompt` y el botón
// "Descargar app" del menú funcione. También deja cacheado el shell básico
// para que la app cargue más rápido en visitas repetidas.

const CACHE_NAME = 'cotifactura-shell-v1'
const SHELL_ASSETS = ['/', '/manifest.json', '/apple-icon.jpg', '/icon-192x192.png', '/icon-512x512.jpg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // Si algún asset falla (ej. en desarrollo), no bloqueamos la instalación.
      }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

// Network-first: siempre intenta traer lo más nuevo; si no hay red, usa caché.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone))
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})
