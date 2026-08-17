'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim()

export function useAdminMfa(userEmail?: string | null) {
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaVerified, setMfaVerified] = useState(false)
  const [loading, setLoading] = useState(true)

  const isAdmin = !!userEmail && !!ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) { if (!cancelled) setLoading(false); return }

      const res = await fetch('/api/admin/mfa/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (cancelled) return

      if (res.ok) {
        const data = await res.json()
        setMfaEnabled(data.enabled)
        // Si MFA no está habilitado, no se necesita verificación
        if (!data.enabled) setMfaVerified(true)
      }
      setLoading(false)
    }

    check()
    return () => { cancelled = true }
  }, [isAdmin])

  const verify = useCallback(async (token: string): Promise<{ ok: boolean; error?: string }> => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { ok: false, error: 'No hay sesión' }

    const res = await fetch('/api/admin/mfa/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    const data = await res.json()

    if (!res.ok) return { ok: false, error: data.error }

    setMfaVerified(true)
    return { ok: true }
  }, [])

  const reset = useCallback(() => {
    setMfaVerified(false)
  }, [])

  return { mfaEnabled, mfaVerified, loading, verify, reset, isAdmin }
}
