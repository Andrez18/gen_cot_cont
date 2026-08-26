'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { Loader2, UserCog, UserPlus, Crown, Trash2 } from 'lucide-react'
import { useNotification } from '@/hooks/use_notification'

interface AdminRole {
  user_id: string
  email: string
  granted_by: string | null
  created_at: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AdminAdminsPage() {
  const { user, isLoaded } = useAuth()
  const { success, error: notifError } = useNotification()
  const [admins, setAdmins] = useState<AdminRole[]>([])
  const [rootEmail, setRootEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingEmail, setRemovingEmail] = useState<string | null>(null)

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session ? { Authorization: `Bearer ${session.access_token}` } : null
  }, [])

  const load = useCallback(async () => {
    const headers = await authHeader()
    if (!headers) return

    const res = await fetch('/api/admin/admins/list', { headers })
    if (res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    setAdmins(data.admins ?? [])
    setRootEmail(data.root_email ?? null)
    setLoading(false)
  }, [authHeader])

  useEffect(() => {
    if (isLoaded && user) load()
  }, [isLoaded, user, load])

  const addAdmin = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!EMAIL_REGEX.test(email)) return

    setAdding(true)
    const headers = await authHeader()
    if (!headers) { setAdding(false); return }

    const res = await fetch('/api/admin/admins/add', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json().catch(() => ({}))
    setAdding(false)

    if (!res.ok) {
      notifError('Error', data.error ?? 'No se pudo asignar el administrador')
      return
    }
    success('Administrador asignado', email)
    setNewEmail('')
    load()
  }

  const removeAdmin = async (email: string) => {
    setRemovingEmail(email)
    const headers = await authHeader()
    if (!headers) { setRemovingEmail(null); return }

    const res = await fetch('/api/admin/admins/remove', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setRemovingEmail(null)

    if (res.ok) {
      success('Administrador quitado', email)
      load()
    } else {
      notifError('Error', 'No se pudo quitar al administrador')
    }
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
          <UserCog className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Administradores</h1>
          <p className="text-[13px] text-white/40">
            Asigna o quita accesos al panel · {admins.length + (rootEmail ? 1 : 0)} en total
          </p>
        </div>
      </div>

      {/* Asignar nuevo admin */}
      <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-5">
        <p className="text-sm font-medium text-white/90 mb-3">
          Asignar nuevo administrador
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !adding) addAdmin() }}
            placeholder="correo del usuario registrado..."
            className="flex-1 rounded-full border border-white/12 bg-white/5 px-4 py-2.5 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-white/25 focus:bg-white/8 transition-colors"
          />
          <button
            onClick={addAdmin}
            disabled={adding || !EMAIL_REGEX.test(newEmail.trim())}
            className="flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition-transform hover:bg-white/85 active:scale-[0.98] disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Asignar
          </button>
        </div>
        <p className="mt-2 text-[12px] text-white/35">
          La cuenta ya debe estar registrada en la app.
        </p>
      </div>

      {/* Lista */}
      <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 overflow-hidden">
        {/* Propietario (env) — no removible */}
        {rootEmail && (
          <div className="flex items-center justify-between gap-3 text-sm px-5 py-4 border-b border-white/8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <Crown className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate text-white/90">{rootEmail}</p>
                <p className="text-[12.5px] text-white/40">Acceso total desde la configuración del servidor</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-amber-400/15 text-amber-300 px-3 py-1 text-[11.5px] font-medium">
              Propietario
            </span>
          </div>
        )}

        {admins.length === 0 ? (
          <p className="p-8 text-sm text-white/40 text-center">
            Aún no hay administradores adicionales.
          </p>
        ) : (
          admins.map((a, i) => (
            <div
              key={a.user_id}
              className={`flex items-center justify-between gap-3 text-sm px-5 py-4 ${i !== admins.length - 1 ? 'border-b border-white/8' : ''}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70 text-xs font-semibold">
                  {a.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate text-white/90">{a.email}</p>
                  <p className="text-[12.5px] text-white/40 truncate">
                    Asignado por {a.granted_by ?? '—'} ·{' '}
                    {new Date(a.created_at).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={removingEmail === a.email}
                    title="Quitar administrador"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-red-400/80 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
                  >
                    {removingEmail === a.email
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-white/10 text-white rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">¿Quitar a {a.email}?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/50">
                      Perderá el acceso al panel de administración de inmediato. Su cuenta y sus
                      datos como usuario no se ven afectados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8 hover:text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => removeAdmin(a.email)}
                      className="rounded-full bg-red-500 text-white hover:bg-red-600"
                    >
                      Sí, quitar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
