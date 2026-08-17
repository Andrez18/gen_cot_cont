'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, ImageIcon, ShieldCheck } from 'lucide-react'

interface PaymentRequest {
  id: string
  user_email: string
  amount: number
  final_amount: number
  discount_code: string | null
  discount_amount: number
  reference_number: string
  proof_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminPaymentsPage() {
  const { user, isLoaded } = useAuth()
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/payments/list', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const data = await res.json()
    setRequests(data.requests ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isLoaded && user) load()
  }, [isLoaded, user, load])

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    setActingId(requestId)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await fetch('/api/admin/payments/review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ requestId, action }),
    })

    setActingId(null)
    load()
  }

  const viewProof = async (path: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`/api/admin/payments/proof?path=${encodeURIComponent(path)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
  }

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-white/40">Cargando...</div>
  }

  if (forbidden) {
    return <div className="p-8 text-center text-white/40">No autorizado.</div>
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Pagos pendientes</h1>
          <p className="text-[13px] text-white/40">
            {pending.length} por revisar · {reviewed.length} en historial
          </p>
        </div>
      </div>

      {pending.length === 0 && (
        <p className="text-sm text-white/40">No hay pagos pendientes por revisar.</p>
      )}

      <div className="space-y-3">
        {pending.map((r) => (
          <div
            key={r.id}
            className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-5 flex items-center justify-between gap-4 flex-wrap"
          >
            <div>
              <p className="font-medium text-white/90">{r.user_email}</p>
              <p className="text-sm text-white/45">
                Ref: {r.reference_number} · {' '}
                <span className="text-white/70 font-medium">${(r.final_amount ?? r.amount).toLocaleString('es-CO')} COP</span>
                {r.discount_code && (
                  <span className="ml-1">
                    (código {r.discount_code}, -${r.discount_amount.toLocaleString('es-CO')})
                  </span>
                )}
              </p>
              <p className="text-[12px] text-white/35">
                {new Date(r.created_at).toLocaleString('es-CO')}
              </p>
              {r.proof_path && (
                <button
                  onClick={() => viewProof(r.proof_path!)}
                  className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/60 underline underline-offset-2 hover:text-white"
                >
                  <ImageIcon className="h-3 w-3" /> Ver comprobante
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                disabled={actingId === r.id}
                onClick={() => review(r.id, 'approve')}
                className="flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-transform hover:bg-white/85 active:scale-[0.98] disabled:opacity-50"
              >
                {actingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Aprobar'}
              </button>
              <button
                disabled={actingId === r.id}
                onClick={() => review(r.id, 'reject')}
                className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviewed.length > 0 && (
        <>
          <h2 className="text-[15px] font-semibold pt-2">Historial</h2>
          <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 overflow-hidden">
            {reviewed.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between text-sm px-5 py-3.5 ${i !== reviewed.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                <span className="text-white/70">{r.user_email} · {r.reference_number}</span>
                <span
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
                    r.status === 'approved' ? 'bg-white text-black' : 'bg-red-500/15 text-red-400'
                  }`}
                >
                  {r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
