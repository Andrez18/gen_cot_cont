'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export type SubscriptionStatus = 'loading' | 'active' | 'pending' | 'inactive' | 'trial'

export function useSubscription() {
  const { user, isLoaded: authLoaded } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null)
  const [isTrial, setIsTrial] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus('inactive')
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle()

    const isExpired = data?.current_period_end
      ? new Date(data.current_period_end) < new Date()
      : true

    setCurrentPeriodEnd(data?.current_period_end ?? null)

    // Verificar si está en trial
    const inTrial = data?.trial_ends_at
      ? new Date(data.trial_ends_at) > new Date() && data.status === 'active'
      : false
    setIsTrial(inTrial)

    if (data && !isExpired && data.status === 'active') {
      setStatus(inTrial ? 'trial' : 'active')
      checkSubscriptionExpiry()
      return
    }

    const { data: pendingRequest } = await supabase
      .from('payment_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle()

    setStatus(pendingRequest ? 'pending' : 'inactive')
  }, [user])

  useEffect(() => {
    if (!authLoaded) return
    refresh()
  }, [authLoaded, refresh])

  // Verificar expiración y enviar push notification (se ejecuta una vez por sesión)
  const checkSubscriptionExpiry = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await fetch('/api/subscription/check-expiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
    } catch {
      // Silent
    }
  }, [])

  return { status, currentPeriodEnd, isTrial, refresh }
}
