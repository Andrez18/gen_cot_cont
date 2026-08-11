'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingDown,
  FileSpreadsheet,
  Receipt,
  Settings,
  ArrowRight,
  Sparkles,
  PlusCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/document-utils'

interface Stats {
  totalGastos: number
  cotizaciones: number
  cuentas: number
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export function HomeDashboard() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const load = async () => {
      const [settingsRes, quotationsRes, invoicesRes, expensesRes] = await Promise.all([
        supabase
          .from('user_settings')
          .select('provider_info')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('quotations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('expense_records')
          .select('monto, tipo'),
      ])

      if (cancelled) return

      const providerName = settingsRes.data?.provider_info?.name as string | undefined
      const metadataName = user.user_metadata?.full_name as string | undefined
      setDisplayName(providerName?.trim() || metadataName?.trim() || null)

      const totalGastos = (expensesRes.data ?? [])
        .filter(r => r.tipo === 'gasto')
        .reduce((sum, r) => sum + (Number(r.monto) || 0), 0)

      setStats({
        totalGastos,
        cotizaciones: quotationsRes.count ?? 0,
        cuentas: invoicesRes.count ?? 0,
      })
      setIsLoaded(true)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [user])

  const firstName = (displayName || user?.email || '').split(/\s|@/)[0]

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
        />
        <div className="relative flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {getGreeting()}
          </span>
          {isLoaded ? (
            <h1 className="text-2xl font-bold sm:text-3xl">
              {firstName ? `Hola, ${firstName}` : 'Hola de nuevo'}
            </h1>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}
          <div className="mt-1 text-sm text-muted-foreground">
            {isLoaded && displayName
              ? `Registrado como ${displayName}`
              : isLoaded
                ? `Registrado con ${user?.email}`
                : <Skeleton className="h-4 w-40" />}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/history"
          icon={TrendingDown}
          label="Total en gastos"
          value={isLoaded && stats ? formatCurrency(stats.totalGastos) : null}
          accent="from-red-500/15 to-red-500/0 text-red-500"
        />
        <StatCard
          href="/history"
          icon={FileSpreadsheet}
          label="Cotizaciones"
          value={isLoaded && stats ? String(stats.cotizaciones) : null}
          accent="from-blue-500/15 to-blue-500/0 text-blue-500"
        />
        <StatCard
          href="/history"
          icon={Receipt}
          label="Cuentas de cobro"
          value={isLoaded && stats ? String(stats.cuentas) : null}
          accent="from-emerald-500/15 to-emerald-500/0 text-emerald-500"
        />
      </div>

      {/* Accesos rápidos */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Settings className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">Configuración</p>
                <p className="truncate text-xs text-muted-foreground">
                  Tus datos, firma y forma de pago
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" asChild>
              <Link href="/settings">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium">Crear documento</p>
                <p className="truncate text-xs text-muted-foreground">
                  Nueva cotización o cuenta de cobro
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/quotation/new">
                  <FileSpreadsheet className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/invoice/new">
                  <Receipt className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  href, icon: Icon, label, value, accent,
}: {
  href: string
  icon: React.ElementType
  label: string
  value: string | null
  accent: string
}) {
  return (
    <Link href={href}>
      <Card className="border-border/50 transition-colors hover:bg-muted/40">
        <CardContent className="flex items-center gap-4 py-2">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {value !== null ? (
              <p className="truncate text-lg font-bold">{value}</p>
            ) : (
              <Skeleton className="mt-1 h-6 w-20" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}