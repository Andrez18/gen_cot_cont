'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import {
  Users,
  UserPlus,
  Wallet,
  Clock,
  Tag,
  FileText,
  Receipt,
  TrendingUp,
  Sparkles,
  Shield,
} from 'lucide-react'
import { PillBarChart } from '@/components/admin/pill-bar-chart'
import { MFASettings } from '@/components/admin/mfa-settings'

interface Totals {
  totalUsers: number
  newUsersLast7d: number
  newUsersLast30d: number
  activeSubscriptions: number
  canceledSubscriptions: number
  pendingPayments: number
  rejectedCount: number
  totalRevenue: number
  revenueLast30d: number
  revenueThisMonth: number
  activeDiscountCodes: number
  totalDiscountCodes: number
  totalQuotations: number
  totalInvoices: number
  totalExpenseRecords: number
}

interface ChartPoint {
  date: string
  signups: number
  revenue: number
}

interface RecentUser {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
}

interface DiscountCodeRow {
  code: string
  times_used: number
  active: boolean
}

const cop = (n: number) => `$${n.toLocaleString('es-CO')}`
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-white/40">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] truncate">{value}</p>
          {sublabel && <p className="mt-1 text-[11.5px] text-white/35">{sublabel}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/70">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user, isLoaded } = useAuth()
  const [totals, setTotals] = useState<Totals | null>(null)
  const [chart, setChart] = useState<ChartPoint[]>([])
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [topDiscountCodes, setTopDiscountCodes] = useState<DiscountCodeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (res.status === 401) {
      setForbidden(true)
      setLoading(false)
      return
    }

    const data = await res.json()
    setTotals(data.totals)
    setChart(data.chart ?? [])
    setRecentUsers(data.recentUsers ?? [])
    setTopDiscountCodes(data.topDiscountCodes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isLoaded && user) load()
  }, [isLoaded, user, load])

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-white/40">Cargando...</div>
  }

  if (forbidden || !totals) {
    return <div className="p-8 text-center text-white/40">No autorizado.</div>
  }

  const last7 = chart.slice(-7)
  const weeklySignups = last7.map((c) => ({
    key: WEEKDAYS[new Date(c.date + 'T00:00:00').getDay()],
    value: c.signups,
  }))
  const weeklyRevenue = last7.map((c) => ({
    key: WEEKDAYS[new Date(c.date + 'T00:00:00').getDay()],
    value: c.revenue,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Resumen general</h1>
          <p className="text-[13px] text-white/40">Salud de CotiFactura en los últimos 30 días</p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          label="Usuarios totales"
          value={totals.totalUsers.toLocaleString('es-CO')}
          sublabel={`+${totals.newUsersLast7d} en 7 días`}
        />
        <StatCard
          icon={UserPlus}
          label="Nuevos (30 días)"
          value={totals.newUsersLast30d.toLocaleString('es-CO')}
          sublabel="Registros recientes"
        />
        <StatCard
          icon={TrendingUp}
          label="Suscripciones activas"
          value={totals.activeSubscriptions.toLocaleString('es-CO')}
          sublabel={`${totals.canceledSubscriptions} canceladas`}
        />
        <StatCard
          icon={Clock}
          label="Pagos pendientes"
          value={totals.pendingPayments.toLocaleString('es-CO')}
          sublabel="Por revisar"
        />
        <StatCard
          icon={Wallet}
          label="Ingresos este mes"
          value={cop(totals.revenueThisMonth)}
          sublabel="Pagos aprobados"
        />
        <StatCard
          icon={Wallet}
          label="Ingresos totales"
          value={cop(totals.totalRevenue)}
          sublabel="Histórico aprobado"
        />
        <StatCard
          icon={Tag}
          label="Códigos activos"
          value={totals.activeDiscountCodes.toLocaleString('es-CO')}
          sublabel={`de ${totals.totalDiscountCodes} creados`}
        />
        <StatCard
          icon={FileText}
          label="Documentos generados"
          value={(totals.totalQuotations + totals.totalInvoices).toLocaleString('es-CO')}
          sublabel={`${totals.totalQuotations} cotiz. · ${totals.totalInvoices} cuentas`}
        />
      </div>

      {/* Gráficos tipo cápsula, estilo mockup de la landing */}
      <div className="grid lg:grid-cols-2 gap-4">
        <PillBarChart
          label="Registros de la semana"
          data={weeklySignups}
          formatValue={(v) => `${v} usuarios`}
        />
        <PillBarChart
          label="Ingresos aprobados de la semana"
          data={weeklyRevenue}
          formatValue={(v) => cop(v)}
        />
      </div>

      {/* Actividad de la plataforma + últimos usuarios */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4">
            <Receipt className="h-4 w-4 text-white/60" />
            Actividad de la plataforma
          </h2>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-white/8">
              <span className="text-white/50">Cotizaciones generadas</span>
              <span className="font-semibold">{totals.totalQuotations.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5 border-b border-white/8">
              <span className="text-white/50">Cuentas de cobro generadas</span>
              <span className="font-semibold">{totals.totalInvoices.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2.5">
              <span className="text-white/50">Movimientos de gastos/ingresos</span>
              <span className="font-semibold">{totals.totalExpenseRecords.toLocaleString('es-CO')}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4">
            <UserPlus className="h-4 w-4 text-white/60" />
            Últimos registros
          </h2>
          <div className="space-y-0.5">
            {recentUsers.length === 0 && (
              <p className="text-sm text-white/40">Sin registros aún.</p>
            )}
            {recentUsers.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center justify-between text-sm py-2.5 ${i !== recentUsers.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                <span className="truncate text-white/85">{u.full_name || u.email}</span>
                <span className="text-[12px] text-white/35 shrink-0 ml-2">
                  {new Date(u.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topDiscountCodes.length > 0 && (
        <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4">
            <Tag className="h-4 w-4 text-white/60" />
            Códigos de descuento más usados
          </h2>
          <div className="flex flex-wrap gap-2">
            {topDiscountCodes.map((c) => (
              <span
                key={c.code}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium ${
                  c.active ? 'bg-white text-black' : 'bg-white/8 text-white/50'
                }`}
              >
                {c.code} · {c.times_used} usos
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Seguridad: 2FA */}
      <div className="max-w-lg">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-4">
          <Shield className="h-4 w-4 text-white/60" />
          Seguridad de la cuenta admin
        </h2>
        <MFASettings />
      </div>
    </div>
  )
}
