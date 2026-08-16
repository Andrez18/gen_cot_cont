'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/hooks/use_notification'

interface AuthFormProps {
  /** 'page' = pantalla completa (uso original). 'modal' = solo la card, sin el wrapper de 100vh. */
  variant?: 'page' | 'modal'
}

export function AuthForm({ variant = 'page' }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { success, error: notifError, loading, dismiss } = useNotification()

  const handleForgotPassword = async () => {
    if (!email) {
      notifError('Falta tu correo', 'Ingresá el correo con el que te registraste')
      return
    }

    setIsLoading(true)
    const loadingId = loading('Enviando enlace...')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    dismiss(loadingId)
    setIsLoading(false)

    // Por seguridad no revelamos si el correo existe o no en el sistema.
    if (error) {
      notifError('No se pudo enviar el enlace', error.message)
    } else {
      success('Revisa tu correo', 'Si el correo existe, te enviamos un enlace para restablecer tu contraseña')
      setMode('login')
    }
  }

  const handleSubmit = async () => {
    if (mode === 'forgot') {
      handleForgotPassword()
      return
    }

    if (!email || !password) {
      notifError('Campos incompletos', 'Ingresá tu email y contraseña')
      return
    }
    if (mode === 'register' && !fullName.trim()) {
      notifError('Falta tu nombre', 'Ingresá tu nombre completo para crear la cuenta')
      return
    }
    if (password.length < 6) {
      notifError('Contraseña muy corta', 'Debe tener al menos 6 caracteres')
      return
    }
    if (mode === 'register' && !acceptedPolicy) {
      notifError('Falta tu aceptación', 'Debes aceptar la política de privacidad para crear tu cuenta')
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
      const name = fullName.trim()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (!error && data.session && data.user) {
        await supabase
          .from('user_settings')
          .upsert(
            {
              user_id: data.user.id,
              provider_info: { name },
              // Registro del consentimiento (Ley 1581 de 2012 - Habeas Data).
              policy_accepted_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          )
      }
      dismiss(loadingId)
      if (error) {
        notifError('Error al registrarse', error.message)
      } else {
        success('Cuenta creada', 'Revisa tu email para confirmar tu cuenta')
      }
    }

    setIsLoading(false)
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

  const subtitle = mode === 'login'
    ? 'Inicia sesión en tu cuenta'
    : mode === 'register'
      ? 'Crea tu cuenta gratis'
      : 'Recupera el acceso a tu cuenta'

  const card = (
      <div style={{
        background: '#000000',
        borderRadius: '24px',
        padding: '90px',
        width: '100%',
        maxWidth: '800px',
        border: '1px solid #17171a',
        fontFamily: 'DM Sans, sans-serif',
      }}>
        {/* Logo / título */}
        <div style={{ textAlign: 'left', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'medium', margin: 0, color: '#e4e2e5', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
             CotiFactura
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            {subtitle}
          </p>
        </div>

        {/* Tabs (ocultas en modo "olvidé mi contraseña") */}
        {mode !== 'forgot' && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            background: '#0a0a0a', borderRadius: '8px',
            padding: '4px', marginBottom: '24px', gap: '4px',
            border: '1px solid #17171a',
          }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '8px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 500, fontFamily: 'DM Sans',
                  background: mode === m ? '#17171a' : 'transparent',
                  color: mode === m ? '#e4e2e5' : '#6b7280',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>
        )}

        {/* Formulario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Ej: Persona de Ejemplo"
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Escribe tu correo"
              style={inputStyle}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Escoge una contraseña"
                style={inputStyle}
              />
              {mode === 'register' && (
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Mínimo 6 caracteres
                </p>
              )}
            </div>
          )}

          {mode === 'register' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#9ca3af', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={e => setAcceptedPolicy(e.target.checked)}
                style={{ marginTop: '2px', flexShrink: 0 }}
              />
              <span>
                Acepto la{' '}
                <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" style={{ color: '#e4e2e5', textDecoration: 'underline' }}>
                  política de privacidad
                </a>{' '}
                y el tratamiento de mis datos personales conforme a la Ley 1581 de 2012.
              </span>
            </label>
          )}

          {mode === 'forgot' && (
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '-6px' }}>
              Te enviaremos un enlace a tu correo para crear una nueva contraseña.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isLoading || (mode === 'register' && !acceptedPolicy)}
            style={{
              width: '100%', padding: '11px', border: 'none', borderRadius: '8px',
              background: '#fafafa',
              color: '#0a0a0a', fontSize: '14px', fontWeight: 'medium',
              cursor: (isLoading || (mode === 'register' && !acceptedPolicy)) ? 'not-allowed' : 'pointer',
              opacity: (mode === 'register' && !acceptedPolicy) ? 0.5 : 1,
              fontFamily: 'DM Sans', marginTop: '4px',
              transition: 'background 0.15s ease',
            }}
          >
            {isLoading
              ? 'Cargando...'
              : mode === 'login' ? 'Iniciar sesión'
              : mode === 'register' ? 'Crear cuenta'
              : 'Enviar enlace'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          {mode === 'forgot' ? (
            <button
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: '#fafafa', fontWeight: 600, cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}
            >
              Volver a iniciar sesión
            </button>
          ) : (
            <>
              {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                style={{ background: 'none', border: 'none', color: '#fafafa', fontWeight: 600, cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial' }}
              >
                {mode === 'login' ? 'Registrate' : 'Inicia sesión'}
              </button>
            </>
          )}
        </p>
      </div>
  )

  if (variant === 'modal') {
    return card
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
      {card}
    </div>
  )
}
