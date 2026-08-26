'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { WorkerLoan } from '@/lib/types'

export function useWorkerLoans() {
  const [loans, setLoans] = useState<WorkerLoan[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('worker_loans')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setLoans(data ?? [])
          setIsLoaded(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  const addLoan = useCallback(async (draft: {
    worker_name: string
    amount: number
    loan_date: string
    reason?: string | null
    notes?: string | null
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('worker_loans')
      .insert([{ user_id: user.id, ...draft }])
      .select()
      .single()

    if (!error && data) {
      setLoans(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  const markAsPaid = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('worker_loans')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setLoans(prev => prev.map(l => (l.id === id ? data : l)))
    }
    return { data, error }
  }, [])

  const deleteLoan = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('worker_loans')
      .delete()
      .eq('id', id)

    if (!error) {
      setLoans(prev => prev.filter(l => l.id !== id))
    }
    return { error }
  }, [])

  const totalPending = loans
    .filter(l => l.status === 'pending')
    .reduce((sum, l) => sum + Number(l.amount), 0)

  const totalPaid = loans
    .filter(l => l.status === 'paid')
    .reduce((sum, l) => sum + Number(l.amount), 0)

  return {
    loans,
    addLoan,
    markAsPaid,
    deleteLoan,
    isLoaded,
    totalPending,
    totalPaid,
  }
}
