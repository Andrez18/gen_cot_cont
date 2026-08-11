'use client'

import { useAuth } from '@/hooks/use-auth'
import { LandingPage } from './landing-page'

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

  if (!isLoaded) {
    return <LoadingScreen />
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