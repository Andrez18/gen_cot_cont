'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { usePushRegistration } from '@/hooks/use-push-registration'
import { usePathname } from 'next/navigation'
import { SubscriptionPaywall } from './subscription-paywall'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim()

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
  const pathname = usePathname()
  const pushRegistered = useRef(false)

  // Registrar push notifications una sola vez cuando el usuario tiene sesión activa
  useEffect(() => {
    if (user && status === 'active' && !pushRegistered.current) {
      pushRegistered.current = true
      register()
    }
  }, [user, status, register])

  // Permitir acceso a rutas públicas sin verificación de suscripción
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return <>{children}</>
  }

  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL
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

  if (status === 'inactive' || status === 'pending') {
    return <SubscriptionPaywall status={status} onSubmitted={refresh} />
  }

  return <>{children}</>
}
