'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'

export type SubscriptionStatus = 'loading' | 'active' | 'pending' | 'inactive'

export function useSubscription() {
  const { user, isLoaded: authLoaded } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus>('loading')
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus('inactive')
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle()

    const isExpired = data?.current_period_end
      ? new Date(data.current_period_end) < new Date()
      : true

    setCurrentPeriodEnd(data?.current_period_end ?? null)

    if (data && !isExpired && data.status === 'active') {
      setStatus('active')
      return
    }

    // No hay suscripción activa: revisamos si tiene un pago pendiente de revisión.
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

  return { status, currentPeriodEnd, refresh }
}
