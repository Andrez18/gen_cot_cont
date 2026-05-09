'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useQuotations() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setQuotations(data)
        setIsLoaded(true)
      })
  }, [])

  const saveQuotation = useCallback(async (q: any) => {
    const { data: { user } } = await supabase.auth.getUser()  
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('quotations')
      .insert([{
        user_id: user.id,  
        number: q.number,
        date: q.date,
        city: q.city,
        client: q.client,
        provider: q.provider,
        items: q.items,
        total: q.total,
        bank_info: q.bankInfo,
        notes: q.notes,
        legal_text: q.legalText,
      }])
      .select()
      .single()

    if (!error && data) {
      setQuotations(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  return { quotations, saveQuotation, isLoaded }
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setInvoices(data)
        setIsLoaded(true)
      })
  }, [])

  const saveInvoice = useCallback(async (inv: any) => {
    const { data: { user } } = await supabase.auth.getUser()  
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        user_id: user.id,  
        number: inv.number,
        date: inv.date,
        city: inv.city,
        client: inv.client,
        provider: inv.provider,
        concept: inv.concept,
        amount: inv.amount,
        amount_in_words: inv.amountInWords,
        bank_info: inv.bankInfo,
      }])
      .select()
      .single()

    if (!error && data) {
      setInvoices(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  return { invoices, saveInvoice, isLoaded }
}

export function useExpenseRecords() {
  const [records, setRecords] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('expense_records')
      .select('*')
      .is('report_id', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRecords(data)
        setIsLoaded(true)
      })
  }, [])

  const addRecord = useCallback(async (record: {
    descripcion: string
    monto: number
    cat: string
    tipo: 'gasto' | 'ingreso'
    fecha: string
    foto_url?: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('expense_records')
      .insert([{ user_id: user.id, ...record }])
      .select()
      .single()

    if (!error && data) {
      setRecords(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  const deleteRecord = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('expense_records')
      .delete()
      .eq('id', id)

    if (!error) {
      setRecords(prev => prev.filter(r => r.id !== id))
    }
    return { error }
  }, [])

  const clearRecords = useCallback(async (ids: string[], reportId: string) => {
    const { error } = await supabase
      .from('expense_records')
      .update({ report_id: reportId })
      .in('id', ids)

    if (!error) {
      setRecords([])
    }
    return { error }
  }, [])

  return { records, addRecord, deleteRecord, clearRecords, isLoaded }
}

export function useExpenseReports() {
  const [reports, setReports] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    supabase
      .from('expense_reports')
      .select('*, expense_records(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReports(data)
        setIsLoaded(true)
      })
  }, [])

  const saveReport = useCallback(async (report: {
    fecha: string
    ingresos: number
    gastos: number
    balance: number
    gastos_por_cat: Record<string, number>
    total_registros: number
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('expense_reports')
      .insert([{ user_id: user.id, ...report }])
      .select()
      .single()

    if (!error && data) {
      setReports(prev => [data, ...prev])
    }
    return { data, error }
  }, [])

  return { reports, saveReport, isLoaded }
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

      const { error } = await supabase.storage
        .from('expense-photos')
        .upload(fileName, file, { contentType: file.type })

      if (error) {
        console.error('Error subiendo foto:', error.message)
        return null
      }

      const { data } = supabase.storage
        .from('expense-photos')
        .getPublicUrl(fileName)

      return data.publicUrl
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deletePhoto = useCallback(async (url: string) => {
    // Extraer la ruta completa después del bucket, no solo el nombre
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/expense-photos/')
    const filePath = pathParts[1]
    if (!filePath) return
    await supabase.storage.from('expense-photos').remove([filePath])
  }, [])

  return { uploadPhoto, deletePhoto, isUploading }
}