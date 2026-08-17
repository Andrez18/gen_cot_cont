'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Quotation, Invoice, ClientInfo, ProviderInfo, LineItem, BankInfo } from '@/lib/types'

/* =========================
   TIPOS
========================= */

// Tamaño de página para las consultas paginadas (historial de
// cotizaciones, cuentas, informes de gastos y herramientas). Evita traer
// toda la tabla de una sola vez a medida que crece con el uso.
const PAGE_SIZE = 20

export interface Tool {
  id: string
  user_id: string
  nombre: string
  precio_dia: number | null
  dias_usados: number | null
  precio_total: number | null
  total_calculado: number
  obra_id: string | null
  obra_nombre: string | null
  created_at: string
  updated_at: string
}

/** Fila cruda de la tabla quotations en Supabase (snake_case). */
export interface SupabaseQuotationRow {
  id: string
  user_id: string
  number: string
  date: string
  city: string
  client: ClientInfo
  provider: ProviderInfo
  items: LineItem[]
  total: number
  bank_info: BankInfo
  notes: string | null
  legal_text: string | null
  created_at: string
}

/** Fila cruda de la tabla invoices en Supabase (snake_case). */
export interface SupabaseInvoiceRow {
  id: string
  user_id: string
  number: string
  date: string
  city: string
  client: ClientInfo
  provider: ProviderInfo
  concept: string
  amount: number
  amount_in_words: string
  bank_info: BankInfo
  created_at: string
}

/** Fila cruda de la tabla expense_records en Supabase (snake_case). */
export interface SupabaseExpenseRecordRow {
  id: string
  user_id: string
  report_id: string | null
  descripcion: string
  monto: number
  cat: string
  tipo: 'gasto' | 'ingreso'
  fecha: string
  foto_url: string | null
  created_at: string
}

/** Fila cruda de la tabla expense_reports en Supabase (snake_case). */
export interface SupabaseExpenseReportRow {
  id: string
  user_id: string
  fecha: string
  ingresos: number
  gastos: number
  balance: number
  gastos_por_cat: Record<string, number>
  total_registros: number
  expense_records: SupabaseExpenseRecordRow[]
  created_at: string
  // Aliases camelCase que la UI puede recibir del servidor
  gastosPorCat?: Record<string, number>
  totalRegistros?: number
}

/* =========================
   QUOTATIONS
========================= */

export function useQuotations() {
  const [quotations, setQuotations] = useState<SupabaseQuotationRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    return data ?? []
  }, [])

  useEffect(() => {
    fetchPage(0).then(data => {
      setQuotations(data)
      setHasMore(data.length === PAGE_SIZE)
      setIsLoaded(true)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const data = await fetchPage(quotations.length)
    setQuotations(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setIsLoadingMore(false)
  }, [fetchPage, quotations.length, hasMore, isLoadingMore])

  const saveQuotation = useCallback(async (q: Quotation) => {
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

  return { quotations, saveQuotation, isLoaded, hasMore, isLoadingMore, loadMore }
}

/* =========================
   INVOICES
========================= */

export function useInvoices() {
  const [invoices, setInvoices] = useState<SupabaseInvoiceRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    return data ?? []
  }, [])

  useEffect(() => {
    fetchPage(0).then(data => {
      setInvoices(data)
      setHasMore(data.length === PAGE_SIZE)
      setIsLoaded(true)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const data = await fetchPage(invoices.length)
    setInvoices(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setIsLoadingMore(false)
  }, [fetchPage, invoices.length, hasMore, isLoadingMore])

  const saveInvoice = useCallback(async (inv: Invoice) => {
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

  return { invoices, saveInvoice, isLoaded, hasMore, isLoadingMore, loadMore }
}

/* =========================
   EXPENSE RECORDS
========================= */

export function useExpenseRecords() {
  const [records, setRecords] = useState<SupabaseExpenseRecordRow[]>([])
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

/* =========================
   EXPENSE REPORTS
========================= */

export function useExpenseReports() {
  const [reports, setReports] = useState<SupabaseExpenseReportRow[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(async (offset: number) => {
    const { data } = await supabase
      .from('expense_reports')
      .select('*, expense_records(*)')
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
    return data ?? []
  }, [])

  useEffect(() => {
    fetchPage(0).then(data => {
      setReports(data)
      setHasMore(data.length === PAGE_SIZE)
      setIsLoaded(true)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const data = await fetchPage(reports.length)
    setReports(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setIsLoadingMore(false)
  }, [fetchPage, reports.length, hasMore, isLoadingMore])

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

  return { reports, saveReport, isLoaded, hasMore, isLoadingMore, loadMore }
}

/* =========================
   STORAGE – PHOTOS
========================= */

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false)

  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${ext}`

      const { error } = await supabase.storage
        .from('expense-photos')
        .upload(fileName, file, { contentType: file.type })

      if (error) {
        return null
      }

      // Guardar el path relativo dentro del bucket (ej: "userId/timestamp.jpg")
      // En lugar de una URL pública que no funciona si el bucket es privado.
      // El path se convierte a signed URL en el momento de mostrarlo/descargarlo.
      return `supabase-storage://expense-photos/${fileName}`
    } finally {
      setIsUploading(false)
    }
  }, [])

  const deletePhoto = useCallback(async (url: string) => {
    // Soportar tanto el formato nuevo (supabase-storage://) como el antiguo (https://)
    let filePath: string | undefined
    if (url.startsWith('supabase-storage://expense-photos/')) {
      filePath = url.replace('supabase-storage://expense-photos/', '')
    } else {
      try {
        const urlObj = new URL(url)
        filePath = urlObj.pathname.split('/expense-photos/')[1]
      } catch {
        return
      }
    }
    if (!filePath) return
    await supabase.storage.from('expense-photos').remove([filePath])
  }, [])

  return { uploadPhoto, deletePhoto, isUploading }
}

/* =========================
   STORAGE – COMPROBANTE DE PAGO
========================= */

export function usePaymentProofUpload() {
  const [isUploading, setIsUploading] = useState(false)

  // Sube el comprobante (foto del pago por Nequi) al bucket privado
  // "payment-proofs", dentro de la carpeta del usuario. Devuelve el path
  // relativo (ej: "userId/timestamp-comprobante.jpg"), que es lo que se
  // envía a /api/payments/submit para que el servidor valide y guarde.
  const uploadProof = useCallback(async (file: File): Promise<string | null> => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${ext}`

      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file, { contentType: file.type })

      if (error) {
        return null
      }

      return fileName
    } finally {
      setIsUploading(false)
    }
  }, [])

  return { uploadProof, isUploading }
}

/* =========================
   TOOLS
========================= */

export function useTools(obraName?: string | null) {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchPage = useCallback(async (offset: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('tools')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (obraName) {
      query = query.eq('obra_nombre', obraName)
    }

    const { data } = await query
    return data ?? []
  }, [obraName])

  useEffect(() => {
    setIsLoaded(false)
    fetchPage(0).then(data => {
      setTools(data)
      setHasMore(data.length === PAGE_SIZE)
      setIsLoaded(true)
    })
  }, [fetchPage])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const data = await fetchPage(tools.length)
    setTools(prev => [...prev, ...data])
    setHasMore(data.length === PAGE_SIZE)
    setIsLoadingMore(false)
  }, [fetchPage, tools.length, hasMore, isLoadingMore])

  const addTool = useCallback(async (tool: {
    nombre: string
    precio_dia: number | null
    precio_total: number | null
    dias_usados: number | null
    obra_id?: string | null
    obra_nombre?: string | null
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('No autenticado') }

    const { data, error } = await supabase
      .from('tools')
      .insert([{ user_id: user.id, ...tool }])
      .select()
      .single()

    if (!error && data) {
      setTools(prev => [data, ...prev])
    }

    return { data, error }
  }, [])

  const updateTool = useCallback(async (
    id: string,
    updates: Partial<{
      nombre: string
      precio_dia: number | null
      precio_total: number | null
      dias_usados: number | null
      obra_id: string | null
      obra_nombre: string | null
    }>
  ) => {
    const { data, error } = await supabase
      .from('tools')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setTools(prev => prev.map(t => (t.id === id ? data : t)))
    }

    return { data, error }
  }, [])

  const deleteTool = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', id)

    if (!error) {
      setTools(prev => prev.filter(t => t.id !== id))
    }

    return { error }
  }, [])

  return {
    tools,
    addTool,
    updateTool,
    deleteTool,
    isLoaded,
    hasMore,
    isLoadingMore,
    loadMore,
  }
}