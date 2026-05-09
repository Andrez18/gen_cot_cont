'use client'

import { useAuth } from '@/hooks/use-auth'
import { AuthForm } from './auth-form'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth()

  if (!isLoaded) {
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

  if (!user) return <AuthForm />

  return <>{children}</>
}