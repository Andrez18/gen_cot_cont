'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { QuotationForm } from '@/components/quotation-form'
import { supabase } from '@/lib/supabase'
import type { Quotation } from '@/lib/types'
import { Suspense } from 'react'

function EditQuotationContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID de cotización no proporcionado')
      setLoading(false)
      return
    }

    const load = async () => {
      const { data, error: dbError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError || !data) {
        setError('No se pudo cargar la cotización')
        setLoading(false)
        return
      }

      setQuotation({
        id: data.id,
        number: data.number,
        date: data.date,
        city: data.city,
        client: data.client,
        provider: data.provider,
        items: data.items,
        total: data.total,
        bankInfo: data.bank_info,
        notes: data.notes ?? '',
        legalText: data.legal_text ?? '',
        createdAt: data.created_at,
      })
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse text-muted-foreground text-center py-12">Cargando cotización...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 text-destructive">{error ?? 'Cotización no encontrada'}</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Editar Cotización</h1>
            <p className="mt-2 text-muted-foreground">
              Modifica los datos de la cotización #{quotation.number}
            </p>
          </div>
          <QuotationForm editData={quotation} />
        </div>
      </main>
    </div>
  )
}

export default function EditQuotationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse text-muted-foreground text-center py-12">Cargando...</div>
          </div>
        </main>
      </div>
    }>
      <EditQuotationContent />
    </Suspense>
  )
}
