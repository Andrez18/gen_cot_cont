'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { usePushRegistration } from '@/hooks/use-push-registration'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { usePathname } from 'next/navigation'
import { SubscriptionPaywall } from './subscription-paywall'

// Rutas públicas que no requieren suscripción
const PUBLIC_ROUTES = [
  '/politica-de-privacidad',
  '/politica-de-uso-y-compra',
  '/aviso-legal',
  '/contacto',
  '/reset-password',
]

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { status, refresh } = useSubscription()
  const { register } = usePushRegistration()
  const { isAdmin } = useIsAdmin()
  const pathname = usePathname()
  const pushRegistered = useRef(false)
  const [showRenewal, setShowRenewal] = useState(false)

  // Escuchar evento de renovación desde subscription-settings
  useEffect(() => {
    const handler = () => setShowRenewal(true)
    window.addEventListener('open-renewal', handler)
    return () => window.removeEventListener('open-renewal', handler)
  }, [])

  // Registrar push notifications una sola vez cuando el usuario tiene sesión activa.
  // El admin también debe recibir pushes (avisos de nuevos pagos), aunque no
  // tenga suscripción activa él mismo.
  useEffect(() => {
    if (user && (status === 'active' || isAdmin) && !pushRegistered.current) {
      pushRegistered.current = true
      register()
    }
  }, [user, status, isAdmin, register])

  // Permitir acceso a rutas públicas sin verificación de suscripción
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return <>{children}</>
  }

  if (isAdmin) return <>{children}</>

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Arial', color: '#6b7280', fontSize: '14px',
        }}
      >
        Verificando suscripción...
      </div>
    )
  }

  // Mostrar paywall en modo renovación si el usuario lo solicitó
  if (showRenewal && status === 'active') {
    return (
      <SubscriptionPaywall
        status="renewal"
        onSubmitted={() => { setShowRenewal(false); refresh() }}
        onClose={() => setShowRenewal(false)}
      />
    )
  }

  // Permitir acceso durante trial o suscripción activa
  if (status === 'active' || status === 'trial') {
    return <>{children}</>
  }

  if (status === 'inactive' || status === 'pending') {
    return <SubscriptionPaywall status={status} onSubmitted={refresh} />
  }

  return <>{children}</>
}
