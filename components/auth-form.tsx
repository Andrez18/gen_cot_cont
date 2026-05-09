'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/hooks/use_notification'

export function AuthForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { success, error: notifError, loading, dismiss } = useNotification()

  const handleSubmit = async () => {
    if (!email || !password) {
      notifError('Campos incompletos', 'Ingresá tu email y contraseña')
      return
    }
    if (password.length < 6) {
      notifError('Contraseña muy corta', 'Debe tener al menos 6 caracteres')
      return
    }

    setIsLoading(true)
    const loadingId = loading(mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      dismiss(loadingId)
      if (error) {
        notifError('Error al iniciar sesión', error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message)
      } else {
        success('Bienvenido', email)
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      dismiss(loadingId)
      if (error) {
        notifError('Error al registrarse', error.message)
      } else {
        success('Cuenta creada', 'Revisá tu email para confirmar tu cuenta')
      }
    }

    setIsLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#111827',
    background: '#fff',
    fontFamily: 'Arial, sans-serif',
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
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        {/* Logo / título */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#111827', margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
          }}>
            📄
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#111827' }}>
            CotiFactura
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {mode === 'login' ? 'Iniciá sesión en tu cuenta' : 'Creá tu cuenta gratis'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          background: '#f3f4f6', borderRadius: '8px',
          padding: '4px', marginBottom: '24px', gap: '4px',
        }}>
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, fontFamily: 'Arial',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#111827' : '#6b7280',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="tu@email.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••••"
              style={inputStyle}
            />
            {mode === 'register' && (
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
              background: isLoading ? '#9ca3af' : '#111827',
              color: '#fff', fontSize: '14px', fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'Arial', marginTop: '4px',
              transition: 'background 0.15s ease',
            }}
          >
            {isLoading
              ? 'Cargando...'
              : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <button
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: '#111827', fontWeight: 600, cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}
          >
            {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}