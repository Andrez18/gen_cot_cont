'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { CreditCard, Loader2, RefreshCw, AlertTriangle, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useNotification } from '@/hooks/use_notification'

type Row = {
  status: 'active' | 'inactive' | 'canceled' | string
  current_period_end: string | null
  trial_ends_at: string | null
}

export function SubscriptionSettings() {
  const { user, isLoaded } = useAuth()
  const { success, error: notifError } = useNotification()
  const [row, setRow] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, trial_ends_at')
      .eq('user_id', user.id)
      .maybeSingle()
    setRow(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (isLoaded && user) load()
    if (isLoaded && !user) setLoading(false)
  }, [isLoaded, user, load])

  const isExpired = row?.current_period_end
    ? new Date(row.current_period_end) < new Date()
    : true
  const isActive = row?.status === 'active' && !isExpired

  const isTrial = row?.trial_ends_at
    ? new Date(row.trial_ends_at) > new Date() && isActive
    : false

  const daysLeft = row?.current_period_end
    ? Math.ceil((new Date(row.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpiringSoon = isActive && daysLeft <= 7 && daysLeft > 0

  const handleCancel = async () => {
    setCanceling(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setCanceling(false); return }

    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json().catch(() => ({}))
    setCanceling(false)

    if (!res.ok) {
      notifError('No se pudo cancelar', data.error ?? 'Intenta de nuevo más tarde')
      return
    }

    success('Suscripción cancelada', 'Ya no se renovará tu acceso')
    load()
  }

  if (!isLoaded || loading) return null
  // Si nunca ha tenido suscripción (nunca pagó), no mostramos esta card:
  // el paywall se encarga de eso.
  if (!row) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Suscripción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estado</span>
          <div className="flex items-center gap-2">
            {isTrial && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Zap className="h-3 w-3" />
                Trial
              </span>
            )}
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Activa' : row.status === 'canceled' ? 'Cancelada' : 'Inactiva'}
            </Badge>
          </div>
        </div>

        {row.current_period_end && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isActive ? 'Vence el' : 'Venció el'}
            </span>
            <span>{new Date(row.current_period_end).toLocaleDateString('es-CO')}</span>
          </div>
        )}

        {isExpiringSoon && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              {daysLeft === 1
                ? 'Tu suscripción vence mañana'
                : `Tu suscripción vence en ${daysLeft} días`}
            </span>
          </div>
        )}

        {isActive && (
          <>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-renewal'))
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Renovar suscripción
            </Button>

            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-2 text-destructive hover:text-destructive">
                Cancelar suscripción
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar tu suscripción?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perderás el acceso a la plataforma. Puedes volver a suscribirte
                  cuando quieras registrando un nuevo pago.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={canceling}>
                  {canceling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sí, cancelar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  )
}
