'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/header'
import { InvoiceForm } from '@/components/invoice-form'
import { supabase } from '@/lib/supabase'
import type { Invoice } from '@/lib/types'
import { Suspense } from 'react'

function EditInvoiceContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID de cuenta de cobro no proporcionado')
      setLoading(false)
      return
    }

    const load = async () => {
      const { data, error: dbError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError || !data) {
        setError('No se pudo cargar la cuenta de cobro')
        setLoading(false)
        return
      }

      setInvoice({
        id: data.id,
        number: data.number,
        date: data.date,
        city: data.city,
        client: data.client,
        provider: data.provider,
        concept: data.concept,
        amount: data.amount,
        amountInWords: data.amount_in_words,
        bankInfo: data.bank_info,
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
            <div className="animate-pulse text-muted-foreground text-center py-12">Cargando cuenta de cobro...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 text-destructive">{error ?? 'Cuenta de cobro no encontrada'}</div>
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
            <h1 className="text-2xl font-bold sm:text-3xl">Editar Cuenta de Cobro</h1>
            <p className="mt-2 text-muted-foreground">
              Modifica los datos de la cuenta de cobro #{invoice.number}
            </p>
          </div>
          <InvoiceForm editData={invoice} />
        </div>
      </main>
    </div>
  )
}

export default function EditInvoicePage() {
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
      <EditInvoiceContent />
    </Suspense>
  )
}
