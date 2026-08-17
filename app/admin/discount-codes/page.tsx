'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, Tag } from 'lucide-react'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  max_uses: number | null
  times_used: number
  active: boolean
  expires_at: string | null
  created_at: string
}

const fieldClass =
  'w-full rounded-2xl border border-white/12 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none focus:border-white/25 focus:bg-white/8 transition-colors'
const labelClass = 'text-[12px] font-medium text-white/45'

export default function AdminDiscountCodesPage() {
  const { user, isLoaded } = useAuth()
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [code, setCode] = useState('')
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : null
  }, [])

  const load = useCallback(async () => {
    const headers = await authHeader()
    if (!headers) return

    const res = await fetch('/api/admin/discount-codes/list', { headers })
    if (res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    setCodes(data.codes ?? [])
    setLoading(false)
  }, [authHeader])

  useEffect(() => {
    if (isLoaded && user) load()
  }, [isLoaded, user, load])

  const createCode = async () => {
    setError(null)
    setCreating(true)
    const headers = await authHeader()
    if (!headers) { setCreating(false); return }

    const res = await fetch('/api/admin/discount-codes/create', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type,
        value: Number(value),
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt || null,
      }),
    })
    const data = await res.json()
    setCreating(false)

    if (!res.ok) {
      setError(data.error ?? 'No se pudo crear el código')
      return
    }

    setCode(''); setValue(''); setMaxUses(''); setExpiresAt('')
    load()
  }

  const toggleActive = async (c: DiscountCode) => {
    const headers = await authHeader()
    if (!headers) return
    await fetch('/api/admin/discount-codes/toggle', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    })
    load()
  }

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-white/40">Cargando...</div>
  }

  if (forbidden) {
    return <div className="p-8 text-center text-white/40">No autorizado.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
          <Tag className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Códigos de descuento</h1>
          <p className="text-[13px] text-white/40">{codes.filter((c) => c.active).length} activos de {codes.length}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6 space-y-4">
        <h2 className="text-[15px] font-semibold">Crear nuevo código</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Código</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BIENVENIDA10"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
              className={`${fieldClass} appearance-none`}
            >
              <option className="bg-zinc-900" value="percentage">Porcentaje (%)</option>
              <option className="bg-zinc-900" value="fixed">Monto fijo (COP)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>{type === 'percentage' ? 'Porcentaje' : 'Monto COP'}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percentage' ? '10' : '5000'}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Usos máximos (opcional)</label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Sin límite"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Expira (opcional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className={`${fieldClass} [color-scheme:dark]`}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={createCode}
          disabled={creating || !code || !value}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-black transition-transform hover:bg-white/85 active:scale-[0.98] disabled:opacity-50"
        >
          {creating && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear código
        </button>
      </div>

      <div className="space-y-2">
        <h2 className="text-[15px] font-semibold">Códigos existentes</h2>
        {codes.length === 0 && (
          <p className="text-sm text-white/40">Aún no hay códigos creados.</p>
        )}
        <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 overflow-hidden">
          {codes.map((c, i) => (
            <div
              key={c.id}
              className={`flex items-center justify-between text-sm px-5 py-4 ${i !== codes.length - 1 ? 'border-b border-white/8' : ''}`}
            >
              <div>
                <p className="font-medium text-white/90">{c.code}</p>
                <p className="text-[12.5px] text-white/40">
                  {c.type === 'percentage' ? `${c.value}%` : `$${c.value.toLocaleString('es-CO')} COP`}
                  {' · '}
                  {c.times_used}{c.max_uses != null ? `/${c.max_uses}` : ''} usos
                  {c.expires_at && ` · vence ${new Date(c.expires_at).toLocaleDateString('es-CO')}`}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
                    c.active ? 'bg-white text-black' : 'bg-white/8 text-white/50'
                  }`}
                >
                  {c.active ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  onClick={() => toggleActive(c)}
                  className="rounded-full border border-white/15 px-3.5 py-1.5 text-[12.5px] font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white"
                >
                  {c.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
