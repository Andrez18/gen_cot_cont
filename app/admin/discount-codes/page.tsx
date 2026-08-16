'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, ArrowLeft, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'

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
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  if (forbidden) {
    return <div className="p-8 text-center text-muted-foreground">No autorizado.</div>
  }

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
            <h1 className="text-2xl font-bold">Códigos de descuento</h1>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/payments">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Pagos pendientes
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crear nuevo código</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="code">Código</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BIENVENIDA10" />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'percentage' | 'fixed')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                  <SelectItem value="fixed">Monto fijo (COP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="value">{type === 'percentage' ? 'Porcentaje' : 'Monto COP'}</Label>
              <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percentage' ? '10' : '5000'} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxUses">Usos máximos (opcional)</Label>
              <Input id="maxUses" type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Sin límite" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expiresAt">Expira (opcional)</Label>
            <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={createCode} disabled={creating || !code || !value} className="w-full">
            {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear código
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Códigos existentes</h2>
        {codes.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay códigos creados.</p>
        )}
        {codes.map((c) => (
          <div key={c.id} className="flex items-center justify-between text-sm py-3 border-b">
            <div>
              <p className="font-medium">{c.code}</p>
              <p className="text-xs text-muted-foreground">
                {c.type === 'percentage' ? `${c.value}%` : `$${c.value.toLocaleString('es-CO')} COP`}
                {' · '}
                {c.times_used}{c.max_uses != null ? `/${c.max_uses}` : ''} usos
                {c.expires_at && ` · vence ${new Date(c.expires_at).toLocaleDateString('es-CO')}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.active ? 'default' : 'secondary'}>
                {c.active ? 'Activo' : 'Inactivo'}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => toggleActive(c)}>
                {c.active ? 'Desactivar' : 'Activar'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      </main>
    </div>
  )
}
