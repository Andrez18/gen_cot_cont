'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker (public/sw.js).
 * Necesario para que la app cumpla los criterios de "instalabilidad" y el
 * navegador dispare `beforeinstallprompt` (ver hooks/use-pwa-install.ts).
 * Solo se registra en producción y sobre HTTPS/localhost, tal como lo exige
 * la Service Worker API.
 */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => console.error('No se pudo registrar el service worker:', error))
  }, [])

  return null
}
