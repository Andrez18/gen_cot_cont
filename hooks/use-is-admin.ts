'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'

/**
 * Determina si el usuario de la sesión actual es admin (propietario o
 * adicional) consultando al backend, ya que los admins extra viven en la
 * base de datos y no se pueden deducir solo con NEXT_PUBLIC_ADMIN_EMAIL.
 *
 * El resultado se cachea a nivel de módulo por userId para que varios
 * componentes (header, guards, páginas) no repitan la petición.
 */

let cachedUserId: string | null = null
let cachedValue = false
const inflight = new Map<string, Promise<boolean>>()

function loadIsAdmin(userId: string): Promise<boolean> {
  if (cachedUserId === userId) return Promise.resolve(cachedValue)

  let pending = inflight.get(userId)
  if (!pending) {
    pending = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return false
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        if (!res.ok) return false
        const data = await res.json()
        return !!data.isAdmin
      } catch {
        return false
      } finally {
        inflight.delete(userId)
      }
    })()
    inflight.set(userId, pending)
  }

  return pending.then((value) => {
    cachedUserId = userId
    cachedValue = value
    return value
  })
}

export function useIsAdmin() {
  const { user, isLoaded } = useAuth()
  const [isAdmin, setIsAdmin] = useState(() => !!user && cachedUserId === user.id && cachedValue)
  const [checking, setChecking] = useState(() => isLoaded && !!user && cachedUserId !== user?.id)

  useEffect(() => {
    let cancelled = false

    if (!isLoaded) return
    if (!user) {
      setIsAdmin(false)
      setChecking(false)
      return
    }
    if (cachedUserId === user.id) {
      setIsAdmin(cachedValue)
      setChecking(false)
      return
    }

    setChecking(true)
    loadIsAdmin(user.id).then((value) => {
      if (cancelled) return
      setIsAdmin(value)
      setChecking(false)
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, user])

  return { isAdmin, checking }
}
