'use client'

import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  // iOS Safari expone esta propiedad cuando la app fue agregada a inicio.
  const isIOSStandalone = (window.navigator as any).standalone === true
  return isDisplayModeStandalone || isIOSStandalone
}

function detectIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua)
  // iPadOS 13+ se identifica como Mac, pero tiene soporte táctil.
  const isIPadOS = ua.includes('Macintosh') && 'ontouchend' in document
  return isIOSDevice || isIPadOS
}

/**
 * Gestiona la instalación de la PWA (tanto en escritorio como en celular).
 * - Android / Chrome / Edge / desktop: usa el evento `beforeinstallprompt`.
 * - iOS / Safari: no existe ese evento, así que exponemos `isIOS` para
 *   mostrar instrucciones manuales ("Compartir" > "Agregar a inicio").
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    setIsIOS(detectIOS())

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable' as const

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
    return outcome
  }, [deferredPrompt])

  // Se puede ofrecer instalación si: tenemos el prompt nativo, o si es iOS
  // (donde mostraremos instrucciones manuales en vez del prompt nativo).
  const canInstall = !installed && (!!deferredPrompt || isIOS)

  return {
    installed,
    isIOS,
    canInstall,
    hasNativePrompt: !!deferredPrompt,
    promptInstall,
  }
}
