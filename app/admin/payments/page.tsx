'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ImageIcon, ArrowLeft, Tag, Users } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'

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
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  if (forbidden) {
    return <div className="p-8 text-center text-muted-foreground">No autorizado.</div>
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-6">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold">Pagos pendientes</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/discount-codes">
                <Tag className="h-4 w-4 mr-2" />
                Códigos de descuento
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Usuarios
              </Link>
            </Button>
          </div>
        </div>

      {pending.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay pagos pendientes por revisar.</p>
      )}

      <div className="space-y-3">
        {pending.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-6 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{r.user_email}</p>
                <p className="text-sm text-muted-foreground">
                  Ref: {r.reference_number} · ${(r.final_amount ?? r.amount).toLocaleString('es-CO')} COP
                  {r.discount_code && (
                    <span className="ml-1">
                      (código {r.discount_code}, -${r.discount_amount.toLocaleString('es-CO')})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString('es-CO')}
                </p>
                {r.proof_path && (
                  <button
                    onClick={() => viewProof(r.proof_path!)}
                    className="mt-1 flex items-center gap-1 text-xs text-primary underline"
                  >
                    <ImageIcon className="h-3 w-3" /> Ver comprobante
                  </button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  disabled={actingId === r.id}
                  onClick={() => review(r.id, 'approve')}
                >
                  {actingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprobar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === r.id}
                  onClick={() => review(r.id, 'reject')}
                >
                  Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviewed.length > 0 && (
        <>
          <h2 className="text-lg font-semibold pt-4">Historial</h2>
          <div className="space-y-2">
            {reviewed.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b">
                <span>{r.user_email} · {r.reference_number}</span>
                <Badge variant={r.status === 'approved' ? 'default' : 'destructive'}>
                  {r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}
      </main>
    </div>
  )
}
