'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingDown,
  FileSpreadsheet,
  Receipt,
  Settings,
  ArrowRight,
  Sparkles,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/document-utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from 'next-themes'

interface Stats {
  totalGastos: number
  totalIngresos: number
  cotizaciones: number
  cuentas: number
  totalCotizaciones: number
}

interface MonthlyData {
  month: string
  gastos: number
  ingresos: number
}

interface TopClient {
  name: string
  total: number
  count: number
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function getMonthLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-CO', { month: 'short' })
}

export function HomeDashboard() {
  const { user } = useAuth()
  const { currentPeriodEnd } = useSubscription()
  const { resolvedTheme } = useTheme()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const daysLeft = currentPeriodEnd
    ? Math.ceil((new Date(currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isExpiringSoon = daysLeft <= 7 && daysLeft > 0

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const load = async () => {
      const [settingsRes, quotationsRes, invoicesRes, reportsRes, invoicesData] = await Promise.all([
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
          .from('expense_reports')
          .select('fecha, ingresos, gastos, balance')
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('amount, client, date'),
      ])

      if (cancelled) return

      const providerName = settingsRes.data?.provider_info?.name as string | undefined
      const metadataName = user.user_metadata?.full_name as string | undefined
      setDisplayName(providerName?.trim() || metadataName?.trim() || null)

      const reports = reportsRes.data ?? []
      const invoiceList = invoicesData.data ?? []

      // Totales desde informes generados
      const totalGastosFromReports = reports.reduce((sum, r) => sum + (Number(r.gastos) || 0), 0)
      const totalIngresosFromReports = reports.reduce((sum, r) => sum + (Number(r.ingresos) || 0), 0)

      // Totales desde invoices (cuentas de cobro)
      const totalIngresosFromInvoices = invoiceList.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

      const totalCotizaciones = (quotationsRes.data ?? []).reduce((sum, q) => sum + (Number(q.total) || 0), 0)

      setStats({
        totalGastos: totalGastosFromReports,
        totalIngresos: totalIngresosFromReports + totalIngresosFromInvoices,
        cotizaciones: quotationsRes.count ?? 0,
        cuentas: invoicesRes.count ?? 0,
        totalCotizaciones,
      })

      // Monthly data for chart from informes (last 6 months)
      // fecha format is dd/mm/yyyy from isoAFechaDisplay
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
      const now = new Date()
      const months: MonthlyData[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthNum = d.getMonth() + 1
        const yearNum = d.getFullYear()
        const label = monthNames[d.getMonth()]

        // Sum reports that fall in this month/year
        const monthGastos = reports
          .filter(r => {
            const parts = r.fecha?.split('/')
            if (!parts || parts.length !== 3) return false
            const [, m, y] = parts
            return Number(m) === monthNum && Number(y) === yearNum
          })
          .reduce((sum, r) => sum + (Number(r.gastos) || 0), 0)

        const monthIngresosReports = reports
          .filter(r => {
            const parts = r.fecha?.split('/')
            if (!parts || parts.length !== 3) return false
            const [, m, y] = parts
            return Number(m) === monthNum && Number(y) === yearNum
          })
          .reduce((sum, r) => sum + (Number(r.ingresos) || 0), 0)

        // Also include invoices from this month
        const key = `${yearNum}-${String(monthNum).padStart(2, '0')}`
        const monthIngresosInvoices = invoiceList
          .filter(inv => inv.date?.startsWith(key))
          .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

        months.push({ month: label, gastos: monthGastos, ingresos: monthIngresosReports + monthIngresosInvoices })
      }
      setMonthlyData(months)

      // Top clients by invoice amount
      const clientMap = new Map<string, { total: number; count: number }>()
      for (const inv of (invoicesData.data ?? [])) {
        const name = inv.client?.companyName || 'Sin nombre'
        const prev = clientMap.get(name) || { total: 0, count: 0 }
        clientMap.set(name, { total: prev.total + (Number(inv.amount) || 0), count: prev.count + 1 })
      }
      const clients = Array.from(clientMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
      setTopClients(clients)

      setIsLoaded(true)
    }

    load()

    return () => { cancelled = true }
  }, [user])

  const firstName = (displayName || user?.email || '').split(/\s|@/)[0]
  const hasChartData = monthlyData.some(m => m.gastos > 0 || m.ingresos > 0)

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 dark:border-white/8 bg-card p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--foreground), transparent 70%)' }}
        />
        <div className="relative flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {getGreeting()}
          </span>
          {isLoaded ? (
            <h1 className="text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
              {firstName ? `Hola, ${firstName}` : 'Hola de nuevo'}
            </h1>
          ) : (
            <Skeleton className="h-8 w-56" />
          )}
        </div>
      </div>

      {/* Aviso de renovación */}
      {isExpiringSoon && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {daysLeft === 1
                  ? 'Tu suscripción vence mañana'
                  : `Tu suscripción vence en ${daysLeft} días`}
              </p>
              <p className="text-xs text-muted-foreground">
                Renueva para no perder el acceso a la plataforma
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => window.dispatchEvent(new CustomEvent('open-renewal'))}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Renovar
          </Button>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/history"
          icon={TrendingDown}
          label="Total gastos"
          value={isLoaded && stats ? formatCurrency(stats.totalGastos) : null}
          accent="from-red-500/10 to-red-500/0"
        />
        <StatCard
          href="/history"
          icon={TrendingUp}
          label="Total ingresos"
          value={isLoaded && stats ? formatCurrency(stats.totalIngresos) : null}
          accent="from-green-500/10 to-green-500/0"
        />
        <StatCard
          href="/history"
          icon={FileSpreadsheet}
          label="Cotizaciones"
          value={isLoaded && stats ? String(stats.cotizaciones) : null}
          accent="from-blue-500/10 to-blue-500/0"
        />
        <StatCard
          href="/history"
          icon={Receipt}
          label="Cuentas de cobro"
          value={isLoaded && stats ? String(stats.cuentas) : null}
          accent="from-purple-500/10 to-purple-500/0"
        />
      </div>

      {/* Gráficas y resumen */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Gráfica mensual */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Ingresos vs Gastos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <Skeleton className="h-[200px] w-full" />
            ) : hasChartData ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={4} margin={{ left: -10, right: 10 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: '8px',
                      border: `1px solid ${isDark ? '#27272a' : '#e5e7eb'}`,
                      background: isDark ? '#18181b' : '#ffffff',
                      color: isDark ? '#e4e4e7' : '#1f2937',
                      fontSize: '13px',
                    }}
                    labelStyle={{ color: isDark ? '#a1a1aa' : '#6b7280' }}
                    itemStyle={{ color: isDark ? '#e4e4e7' : '#1f2937' }}
                  />
                  <Bar dataKey="ingresos" name="Ingresos" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill="#22c55e" fillOpacity={0.7} />
                    ))}
                  </Bar>
                  <Bar dataKey="gastos" name="Gastos" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill="#ef4444" fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                Registra gastos e ingresos para ver tu resumen financiero
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : topClients.length > 0 ? (
              <div className="space-y-3">
                {topClients.map((client, i) => (
                  <div key={client.name} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.count} doc{client.count !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-bold shrink-0">{formatCurrency(client.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[120px] text-muted-foreground text-sm">
                Aún no tienes cuentas de cobro
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen financiero */}
      {isLoaded && stats && (stats.totalGastos > 0 || stats.totalIngresos > 0) && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Balance total</span>
              </div>
              <span className={`text-lg font-bold ${stats.totalIngresos - stats.totalGastos >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(stats.totalIngresos - stats.totalGastos)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accesos rápidos */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
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

        <Card>
          <CardContent className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
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
      <Card className="transition-colors hover:bg-muted/40">
        <CardContent className="flex items-center gap-4 py-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            {value !== null ? (
              <p className="truncate text-lg font-light tracking-[-0.01em]">{value}</p>
            ) : (
              <Skeleton className="mt-1 h-6 w-20" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}