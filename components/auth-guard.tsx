'use client'

import { useAuth } from '@/hooks/use-auth'
import { LandingPage } from './landing-page'
import { usePathname } from 'next/navigation'

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/politica-de-privacidad',
  '/politica-de-uso-y-compra',
  '/aviso-legal',
  '/contacto',
  '/reset-password',
]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth()
  const pathname = usePathname()

  // Permitir acceso a rutas públicas sin autenticación
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Mientras se resuelve la sesión (o si no hay sesión), mostramos la
  // landing pública de una vez, en lugar de una pantalla de "Cargando...".
  // Esto es clave para SEO: Google y cualquier bot que no ejecute JS (o
  // que le dé un timeout a la ejecución) necesitan ver el contenido real
  // de la landing en el HTML inicial, no un mensaje de carga vacío.
  if (!isLoaded || !user) {
    return <LandingPage />
  }

  // Con sesion confirmada: "/" ahora muestra un panel de inicio propio
  // (ver components/home-dashboard.tsx); el resto de rutas siguen normal.
  return <>{children}</>
}