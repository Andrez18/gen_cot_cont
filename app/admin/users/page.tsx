'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Loader2, ArrowLeft, ShieldCheck, Tag, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { Header } from '@/components/header'

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
    if (u.subscription_status === 'active' && !expired) return { text: 'Activa', variant: 'default' as const }
    if (u.subscription_status === 'canceled') return { text: 'Cancelada', variant: 'secondary' as const }
    return { text: 'Inactiva', variant: 'secondary' as const }
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
            <h1 className="text-2xl font-bold">Usuarios</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/payments">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Pagos
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/discount-codes">
                  <Tag className="h-4 w-4 mr-2" />
                  Códigos
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay usuarios registrados.</p>
          )}
          {users.map((u) => {
            const status = statusLabel(u)
            return (
              <div key={u.id} className="flex items-center justify-between gap-3 text-sm py-3 border-b">
                <div className="min-w-0">
                  <p className="font-medium truncate">{u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                    {' · registrado '}
                    {new Date(u.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={status.variant}>{status.text}</Badge>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={deletingId === u.id}>
                        {deletingId === u.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar a {u.full_name || u.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esto borra su cuenta y todos sus datos (cotizaciones, cuentas de
                          cobro, gastos, firma, suscripción) de forma permanente. No se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(u.id)}>
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
      </main>
    </div>
  )
}
