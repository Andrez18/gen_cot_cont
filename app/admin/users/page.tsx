'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Search, Users as UsersIcon } from 'lucide-react'

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  last_sign_in_at: string | null
  subscription_status: string | null
  current_period_end: string | null
}

export default function AdminUsersPage() {
  const { user, isLoaded } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : null
  }, [])

  const load = useCallback(async () => {
    const headers = await authHeader()
    if (!headers) return

    const res = await fetch('/api/admin/users/list', { headers })
    if (res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }, [authHeader])

  useEffect(() => {
    if (isLoaded && user) load()
  }, [isLoaded, user, load])

  const deleteUser = async (id: string) => {
    setDeletingId(id)
    const headers = await authHeader()
    if (!headers) { setDeletingId(null); return }

    const res = await fetch('/api/admin/users/delete', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    setDeletingId(null)

    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
    }
  }

  const statusLabel = (u: AdminUser) => {
    const expired = u.current_period_end ? new Date(u.current_period_end) < new Date() : true
    if (u.subscription_status === 'active' && !expired) return { text: 'Activa', tone: 'active' as const }
    if (u.subscription_status === 'canceled') return { text: 'Cancelada', tone: 'muted' as const }
    return { text: 'Inactiva', tone: 'muted' as const }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      (u.full_name ?? '').toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    )
  }, [users, query])

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-white/40">Cargando...</div>
  }

  if (forbidden) {
    return <div className="p-8 text-center text-white/40">No autorizado.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
            <UsersIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.01em]">Usuarios</h1>
            <p className="text-[13px] text-white/40">{users.length} registrados en total</p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full rounded-full border border-white/12 bg-white/5 py-2.5 pl-10 pr-4 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 overflow-hidden">
        {filtered.length === 0 && (
          <p className="p-8 text-sm text-white/40 text-center">
            {users.length === 0 ? 'No hay usuarios registrados.' : 'No hay resultados para tu búsqueda.'}
          </p>
        )}
        {filtered.map((u, i) => {
          const status = statusLabel(u)
          return (
            <div
              key={u.id}
              className={`flex items-center justify-between gap-3 text-sm px-5 py-4 ${i !== filtered.length - 1 ? 'border-b border-white/8' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70 text-xs font-semibold">
                  {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate text-white/90">{u.full_name || u.email}</p>
                  <p className="text-[12.5px] text-white/40 truncate">
                    {u.email}
                    {' · registrado '}
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
                    status.tone === 'active' ? 'bg-white text-black' : 'bg-white/8 text-white/50'
                  }`}
                >
                  {status.text}
                </span>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={deletingId === u.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/5 text-red-400/80 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                    >
                      {deletingId === u.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">¿Eliminar a {u.full_name || u.email}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-white/50">
                        Esto borra su cuenta y todos sus datos (cotizaciones, cuentas de
                        cobro, gastos, firma, suscripción) de forma permanente. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8 hover:text-white">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUser(u.id)}
                        className="rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
