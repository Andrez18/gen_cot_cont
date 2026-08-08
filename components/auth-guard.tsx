'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LandingPage } from './landing-page'

// Ruta a la que se manda a un usuario ya logueado cuando cae en "/"
const DEFAULT_APP_ROUTE = '/quotation/new'

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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Si el usuario ya inicio sesion y aterriza en "/", lo mandamos directo
  // a la app (ya no existe una pantalla de "inicio" intermedia).
  useEffect(() => {
    if (isLoaded && user && pathname === '/') {
      router.replace(DEFAULT_APP_ROUTE)
    }
  }, [isLoaded, user, pathname, router])

  if (!isLoaded) {
    return <LoadingScreen />
  }

  // Sin sesion: mostramos la landing publica (con acceso a login/registro
  // mediante un modal) sin importar la ruta a la que se intento entrar.
  if (!user) {
    return <LandingPage />
  }

  // Con sesion, en "/": pantalla de carga mientras se redirige a la app.
  if (pathname === '/') {
    return <LoadingScreen />
  }

  return <>{children}</>
}
