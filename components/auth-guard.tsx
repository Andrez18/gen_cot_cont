'use client'

import { useAuth } from '@/hooks/use-auth'
import { LandingPage } from './landing-page'
import { usePathname } from 'next/navigation'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial', color: '#6b7280', fontSize: '14px',
    }}>
      Cargando...
    </div>
  )
}

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/politica-de-privacidad',
  '/politica-de-uso-y-compra',
  '/aviso-legal',
  '/contacto',
]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth()
  const pathname = usePathname()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  // Permitir acceso a rutas públicas sin autenticación
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Sin sesion: mostramos la landing publica (con acceso a login/registro
  // mediante un modal) sin importar la ruta a la que se intento entrar.
  if (!user) {
    return <LandingPage />
  }

  // Con sesion: "/" ahora muestra un panel de inicio propio (ver
  // components/home-dashboard.tsx); el resto de rutas siguen normal.
  return <>{children}</>
}