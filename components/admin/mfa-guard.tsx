'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAdminMfa } from '@/hooks/use-admin-mfa'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useNotification } from '@/hooks/use_notification'

export function MfaGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useAuth()
  const { mfaEnabled, mfaVerified, loading, verify, isAdmin } = useAdminMfa(user?.email)
  const { success } = useNotification()
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Si no es admin o MFA no está habilitado, pasar directo
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAdmin || !mfaEnabled || mfaVerified) {
    return <>{children}</>
  }

  // MFA habilitado pero no verificado — mostrar pantalla de verificación
  const handleVerify = async () => {
    if (token.length !== 6) return
    setVerifying(true)
    setErrorMsg(null)

    const result = await verify(token)
    setVerifying(false)

    if (!result.ok) {
      setErrorMsg(result.error ?? 'Error desconocido')
      return
    }

    success('Verificado', 'Acceso al panel de administración concedido')
    setToken('')
    setErrorMsg(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && token.length === 6 && !verifying) {
      handleVerify()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto size-16 rounded-full bg-white/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-white/80" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Verificación requerida</h1>
          <p className="text-sm text-white/60">
            Ingresa el código de 6 dígitos de tu app de autenticación para acceder al panel de administración.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            value={token}
            onChange={e => { setToken(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg(null) }}
            onKeyDown={handleKeyDown}
            placeholder="000000"
            maxLength={6}
            autoFocus
            className="font-mono text-center text-2xl tracking-[0.4em] bg-white/5 border-white/20 text-white placeholder:text-white/30 h-14"
          />
          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2 text-left break-all">
              {errorMsg}
            </div>
          )}
          <Button
            onClick={handleVerify}
            disabled={token.length !== 6 || verifying}
            className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold"
          >
            {verifying ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verificando...</>
            ) : (
              'Verificar'
            )}
          </Button>
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
