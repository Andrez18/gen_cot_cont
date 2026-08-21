'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PayrollLineInput, PayrollLineResult, PayrollPaymentType } from '@/lib/payroll'

export const PAGE_SIZE = 20

export interface PayrollEmployeeRow {
  id: string
  user_id: string
  full_name: string
  document_number: string | null
  position: string | null
  payment_type: PayrollPaymentType
  monthly_salary: number | null
  weekly_rate: number | null
  daily_rate: number | null
  hourly_rate: number | null
  task_rate: number | null
  transport_aux: boolean
  /** Descuentos de seguridad social (se apagan si ya la tiene cubierta). */
  deduct_health: boolean
  deduct_pension: boolean
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PayrollEmployeeDraft {
  full_name: string
  document_number?: string | null
  position?: string | null
  payment_type: PayrollPaymentType
  monthly_salary?: number | null
  weekly_rate?: number | null
  daily_rate?: number | null
  hourly_rate?: number | null
  task_rate?: number | null
  transport_aux: boolean
  deduct_health?: boolean
  deduct_pension?: boolean
  active: boolean
  notes?: string | null
}

export interface PayrollRunLine extends PayrollLineInput {
  result: PayrollLineResult
}

export interface PayrollRunRow {
  id: string
  user_id: string
  number: string
  name: string | null
  period_start: string
  period_end: string
  period_label: string | null
  company_name: string | null
  company_nit: string | null
  employee_count: number
  total_devengados: number
  total_deducciones: number
  total_neto: number
  lines: PayrollRunLine[]
  notes: string | null
  created_at: string
}

export function usePayrollEmployees() {
  const [employees, setEmployees] = useState<PayrollEmployeeRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('payroll_employees')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelled) {
          setEmployees(data ?? [])
          setIsLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addEmployee = useCallback(async (draft: PayrollEmployeeDraft) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('payroll_employees')
      .insert([{ user_id: user.id, ...draft }])
      .select()
      .single()

    if (!error && data) {
      setEmployees(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  const updateEmployee = useCallback(async (
    id: string,
    updates: Partial<PayrollEmployeeDraft>,
  ) => {
    const { data, error } = await supabase
      .from('payroll_employees')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setEmployees(prev => prev.map(e => (e.id === id ? data : e)))
    }
    return { data, error }
  }, [])

  const deleteEmployee = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('payroll_employees')
      .delete()
      .eq('id', id)

    if (!error) {
      setEmployees(prev => prev.filter(e => e.id !== id))
    }
    return { error }
  }, [])

  return { employees, addEmployee, updateEmployee, deleteEmployee, isLoaded }
}

export function usePayrollRuns() {
  const [runs, setRuns] = useState<PayrollRunRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from('payroll_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    return data ?? []
  }, [])

  useEffect(() => {
    fetchPage(0).then(data => {
      setRuns(data)
      setHasMore(data.length === PAGE_SIZE)
      setIsLoaded(true)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const data = await fetchPage(runs.length)
    setRuns(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setIsLoadingMore(false)
  }, [fetchPage, runs.length, hasMore, isLoadingMore])

  const saveRun = useCallback(async (run: {
    number: string
    name: string | null
    period_start: string
    period_end: string
    period_label: string | null
    company_name: string | null
    company_nit: string | null
    employee_count: number
    total_devengados: number
    total_deducciones: number
    total_neto: number
    lines: PayrollRunLine[]
    notes: string | null
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('payroll_runs')
      .insert([{ user_id: user.id, ...run }])
      .select()
      .single()

    if (!error && data) {
      setRuns(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  const deleteRun = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('payroll_runs')
      .delete()
      .eq('id', id)

    if (!error) {
      setRuns(prev => prev.filter(r => r.id !== id))
    }
    return { error }
  }, [])

  return { runs, saveRun, deleteRun, isLoaded, hasMore, isLoadingMore, loadMore }
}
