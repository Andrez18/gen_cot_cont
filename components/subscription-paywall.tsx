'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { usePaymentProofUpload } from '@/hooks/use-supabase-storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, Clock, Copy, Check, Camera, X, Tag } from 'lucide-react'

const NEQUI_NUMBER = process.env.NEXT_PUBLIC_NEQUI_NUMBER ?? '300 000 0000'
const NEQUI_HOLDER = process.env.NEXT_PUBLIC_NEQUI_HOLDER ?? 'Tu Nombre'
const PRICE_COP = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000'

export function SubscriptionPaywall({
  status,
  onSubmitted,
}: {
  status: 'inactive' | 'pending'
  onSubmitted: () => Promise<void> | void
}) {
  const { user, signOut } = useAuth()
  const { uploadProof, isUploading } = usePaymentProofUpload()

  const [reference, setReference] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [discountInput, setDiscountInput] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [discount, setDiscount] = useState<{ code: string; finalAmount: number; discountAmount: number } | null>(null)

  const copyNumber = async () => {
    await navigator.clipboard.writeText(NEQUI_NUMBER.replace(/\s/g, ''))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const applyDiscountCode = async () => {
    const code = discountInput.trim()
    if (!code) return

    setApplyingDiscount(true)
    setDiscountError(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setApplyingDiscount(false); return }

    const res = await fetch('/api/payments/validate-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setApplyingDiscount(false)

    if (!res.ok) {
      setDiscountError(data.error ?? 'Código inválido')
      setDiscount(null)
      return
    }

    setDiscount({ code: data.code, finalAmount: data.finalAmount, discountAmount: data.discountAmount })
  }

  const removeDiscount = () => {
    setDiscount(null)
    setDiscountInput('')
    setDiscountError(null)
  }

  const handleSubmit = async () => {
    if (!user?.email) return
    const trimmed = reference.trim()
    if (trimmed.length < 4) {
      setError('Ingresa el número de referencia del comprobante de Nequi')
      return
    }
    if (!proofFile) {
      setError('Adjunta una foto del comprobante de pago')
      return
    }

    setSubmitting(true)
    setError(null)

    const proofPath = await uploadProof(proofFile)
    if (!proofPath) {
      setSubmitting(false)
      setError('No se pudo subir el comprobante. Intenta de nuevo.')
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSubmitting(false); return }

    const res = await fetch('/api/payments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        reference: trimmed,
        proofPath,
        discountCode: discount?.code ?? undefined,
      }),
    })

    setSubmitting(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo registrar el pago. Intenta de nuevo.')
      return
    }

    await onSubmitted()
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Pago en revisión</span>
            </div>
            <CardTitle>Estamos confirmando tu pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ya recibimos tu comprobante. En cuanto se confirme la transferencia
              en Nequi, tu suscripción se activa automáticamente.
            </p>
            <button
              onClick={() => signOut()}
              className="text-xs text-muted-foreground underline w-full text-center"
            >
              Cerrar sesión
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayedPrice = discount ? discount.finalAmount : Number(PRICE_COP)
  const busy = submitting || isUploading

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Lock className="h-4 w-4" />
            <span className="text-xs">Acceso restringido</span>
          </div>
          <CardTitle>Activa tu suscripción mensual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Transfiere por Nequi</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{NEQUI_NUMBER}</span>
              <Button variant="ghost" size="sm" onClick={copyNumber}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">A nombre de {NEQUI_HOLDER}</p>
            <p className="text-sm font-medium">
              Monto: ${displayedPrice.toLocaleString('es-CO')} COP
              {discount && (
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  ${Number(PRICE_COP).toLocaleString('es-CO')}
                </span>
              )}
            </p>
          </div>

          {/* Código de descuento */}
          <div className="space-y-2">
            <Label htmlFor="discount">¿Tienes un código de descuento?</Label>
            {discount ? (
              <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/30">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" /> {discount.code} aplicado
                </span>
                <button onClick={removeDiscount} className="text-muted-foreground hover:text-destructive">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="discount"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  placeholder="Ej: BIENVENIDA10"
                />
                <Button variant="outline" onClick={applyDiscountCode} disabled={applyingDiscount || !discountInput.trim()}>
                  {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                </Button>
              </div>
            )}
            {discountError && <p className="text-sm text-destructive">{discountError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Número de referencia del comprobante</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: M12345678"
            />
          </div>

          <div className="space-y-2">
            <Label>Foto del comprobante</Label>
            {proofPreview ? (
              <div className="flex items-center gap-3">
                <img src={proofPreview} alt="comprobante" className="h-16 w-16 object-cover rounded-md border" />
                <button
                  onClick={() => { setProofFile(null); setProofPreview(null) }}
                  className="text-xs text-destructive underline"
                >
                  Quitar foto
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground cursor-pointer hover:bg-muted/40">
                <Camera className="h-4 w-4" />
                Adjuntar foto del comprobante
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProofChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              El comprobante ayuda a confirmar tu pago más rápido y de forma segura.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSubmit} disabled={busy} className="w-full">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {busy ? 'Enviando...' : 'Ya pagué, confirmar'}
          </Button>

          <button
            onClick={() => signOut()}
            className="text-xs text-muted-foreground underline w-full text-center"
          >
            Cerrar sesión
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
