'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { usePaymentProofUpload } from '@/hooks/use-supabase-storage'
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
      <div
        className="min-h-screen flex items-center justify-center p-6 bg-black text-white antialiased relative overflow-hidden"
        style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 55% 40% at 50% 15%, rgba(255,255,255,0.06), transparent 70%)',
          }}
        />
        <div className="relative max-w-md w-full rounded-3xl border border-white/8 bg-white/3 p-8">
          <div className="flex items-center gap-2 text-white/40 mb-3">
            <Clock className="h-4 w-4" />
            <span className="text-[12.5px] uppercase tracking-[0.1em]">Pago en revisión</span>
          </div>
          <h2 className="text-2xl font-light tracking-[-0.02em] mb-5">Estamos confirmando tu pago</h2>
          <p className="text-[14px] text-white/45 leading-[1.65] mb-8">
            Ya recibimos tu comprobante. En cuanto se confirme la transferencia
            en Nequi, tu suscripción se activa automáticamente.
          </p>
          <button
            onClick={() => signOut()}
            className="text-[12.5px] text-white/35 hover:text-white/60 underline underline-offset-4 w-full text-center transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  const displayedPrice = discount ? discount.finalAmount : Number(PRICE_COP)
  const busy = submitting || isUploading

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-black text-white antialiased relative overflow-hidden"
      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 40% at 50% 15%, rgba(255,255,255,0.06), transparent 70%)',
        }}
      />

      <div className="relative max-w-md w-full rounded-3xl border border-white/8 bg-white/3 p-8">
        <div className="flex items-center gap-2 text-white/40 mb-3">
          <Lock className="h-4 w-4" />
          <span className="text-[12.5px] uppercase tracking-[0.1em]">Acceso restringido</span>
        </div>
        <h2 className="text-2xl font-light tracking-[-0.02em] mb-6">Activa tu suscripción mensual</h2>

        <div className="space-y-5">
          {/* Datos Nequi */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-2.5">
            <p className="text-[12.5px] text-white/40">Transfiere por Nequi</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold tracking-[-0.01em]">{NEQUI_NUMBER}</span>
              <button
                onClick={copyNumber}
                className="flex items-center justify-center h-8 w-8 rounded-full border border-white/[0.14] bg-white/4 hover:bg-white/[0.09] hover:border-white/20 transition-all duration-200"
                aria-label="Copiar número"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[13px] text-white/40">A nombre de {NEQUI_HOLDER}</p>
            <p className="text-[14px] font-medium text-white/80">
              Monto: ${displayedPrice.toLocaleString('es-CO')} COP
              {discount && (
                <span className="ml-2 text-[12px] text-white/30 line-through">
                  ${Number(PRICE_COP).toLocaleString('es-CO')}
                </span>
              )}
            </p>
          </div>

          {/* Código de descuento */}
          <div className="space-y-2">
            <label htmlFor="discount" className="block text-[13px] text-white/50">
              ¿Tienes un código de descuento?
            </label>
            {discount ? (
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px]">
                <span className="flex items-center gap-2 text-white/70">
                  <Tag className="h-3.5 w-3.5 text-white/40" /> {discount.code} aplicado
                </span>
                <button onClick={removeDiscount} className="text-white/35 hover:text-white/70 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="discount"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  placeholder="Ej: BIENVENIDA10"
                  className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
                />
                <button
                  onClick={applyDiscountCode}
                  disabled={applyingDiscount || !discountInput.trim()}
                  className="rounded-xl border border-white/[0.14] bg-white/4 px-4 py-2.5 text-[13.5px] font-medium text-white hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {applyingDiscount ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Aplicar'}
                </button>
              </div>
            )}
            {discountError && <p className="text-[12.5px] text-red-400/80">{discountError}</p>}
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <label htmlFor="reference" className="block text-[13px] text-white/50">
              Número de referencia del comprobante
            </label>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: M12345678"
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors"
            />
          </div>

          {/* Comprobante */}
          <div className="space-y-2">
            <p className="text-[13px] text-white/50">Foto del comprobante</p>
            {proofPreview ? (
              <div className="flex items-center gap-3">
                <img
                  src={proofPreview}
                  alt="comprobante"
                  className="h-16 w-16 object-cover rounded-xl border border-white/8"
                />
                <button
                  onClick={() => { setProofFile(null); setProofPreview(null) }}
                  className="text-[12.5px] text-red-400/80 hover:text-red-400 underline underline-offset-4 transition-colors"
                >
                  Quitar foto
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.14] p-4 text-[13.5px] text-white/40 cursor-pointer hover:bg-white/[0.03] hover:border-white/25 transition-all">
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
            <p className="text-[11.5px] text-white/30 leading-relaxed">
              El comprobante ayuda a confirmar tu pago más rápido y de forma segura.
            </p>
          </div>

          {error && <p className="text-[12.5px] text-red-400/80">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-semibold text-black hover:bg-white/85 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Enviando...' : 'Ya pagué, confirmar'}
          </button>

          <button
            onClick={() => signOut()}
            className="text-[12.5px] text-white/35 hover:text-white/60 underline underline-offset-4 w-full text-center transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}