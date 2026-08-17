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

// ── Push notifications ──────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = { title: 'CotiFactura', body: '', icon: '/icon-192x192.png', badge: '/icon-192x192.png', url: '/' }
  try {
    data = { ...data, ...event.data.json() }
  } catch {
    data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      actions: [],
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Si no, abrir una nueva ventana
      return self.clients.openWindow(url)
    })
  )
})
