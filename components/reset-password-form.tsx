'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/hooks/use_notification'

export function ResetPasswordForm() {
  const router = useRouter()
  const { success, error: notifError, loading, dismiss } = useNotification()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // El link de recuperación crea una sesión temporal vía el hash de la URL
  // (supabase-js la detecta solo con detectSessionInUrl). Mientras se
  // resuelve, mostramos un estado de carga para no pedir la contraseña
  // antes de tiempo.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async () => {
    if (password.length < 6) {
      notifError('Contraseña muy corta', 'Debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      notifError('Las contraseñas no coinciden', 'Verifica que sean iguales')
      return
    }

    setIsLoading(true)
    const loadingId = loading('Guardando nueva contraseña...')

    const { error } = await supabase.auth.updateUser({ password })

    dismiss(loadingId)
    setIsLoading(false)

    if (error) {
      notifError('No se pudo actualizar', error.message)
      return
    }

    success('Contraseña actualizada', 'Ya puedes usar tu nueva contraseña')
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#e4e2e5',
    background: '#202022',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      fontFamily: 'Arial, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        background: '#000000',
        borderRadius: '24px',
        padding: '90px',
        width: '100%',
        maxWidth: '800px',
        border: '1px solid #17171a',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'medium', margin: 0, color: '#e4e2e5' }}>
            Nueva contraseña
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {ready
              ? 'Escribe tu nueva contraseña para tu cuenta de CotiFactura'
              : 'Verificando tu enlace de recuperación...'}
          </p>
        </div>

        {ready ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Mínimo 6 caracteres"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Repite la contraseña"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
                background: '#fafafa',
                color: '#0a0a0a', fontSize: '14px', fontWeight: 'medium',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'DM Sans', marginTop: '4px',
              }}
            >
              {isLoading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            Si este mensaje no cambia en unos segundos, el enlace puede haber expirado.
            Vuelve a solicitar uno desde la pantalla de inicio de sesión.
          </p>
        )}
      </div>
    </div>
  )
}
