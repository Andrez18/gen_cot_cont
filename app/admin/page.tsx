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
  Layers,
  X,
} from 'lucide-react'
import { PillBarChart } from '@/components/admin/pill-bar-chart'
import { PaymentStatusChart } from '@/components/admin/payment-status-chart'
import { MFASettings } from '@/components/admin/mfa-settings'

interface Totals {
  totalUsers: number
  newUsersLast7d: number
  newUsersLast30d: number
  activeSubscriptions: number
  canceledSubscriptions: number
  pendingPayments: number
  approvedCount: number
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

function Panel({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title?: string
  icon?: React.ElementType
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6 ${className}`}
    >
      {title && (
        <h2 className="flex items-center gap-2 text-[15px] font-semibold mb-5">
          {Icon && <Icon className="h-4 w-4 text-white/60" />}
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}

function Stat({
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
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/60">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium text-white/40">{label}</p>
        <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em] truncate">{value}</p>
        {sublabel && <p className="text-[11px] text-white/35">{sublabel}</p>}
      </div>
    </div>
  )
}

/** Botón flotante para abrir la seguridad de la cuenta admin */
function SecurityFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Seguridad de la cuenta admin"
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95"
    >
      <Shield className="h-5 w-5" />
    </button>
  )
}

/** Modal con la configuración de 2FA */
function SecurityModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0a0a0a] bg-linear-to-b from-white/6 to-white/1.5 p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <Shield className="h-4 w-4 text-white/60" />
            Seguridad de la cuenta admin
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/12"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <MFASettings />
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
  const [securityOpen, setSecurityOpen] = useState(false)

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
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">Resumen general</h1>
          <p className="text-[13px] text-white/40">Salud de CotiFactura en los últimos 30 días</p>
        </div>
      </div>

      <Panel title="Estadísticas clave" icon={Layers}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-1">
          <Stat
            icon={Users}
            label="Usuarios totales"
            value={totals.totalUsers.toLocaleString('es-CO')}
            sublabel={`+${totals.newUsersLast7d} en 7 días`}
          />
          <Stat
            icon={UserPlus}
            label="Nuevos (30 días)"
            value={totals.newUsersLast30d.toLocaleString('es-CO')}
            sublabel="Registros recientes"
          />
          <Stat
            icon={TrendingUp}
            label="Suscripciones activas"
            value={totals.activeSubscriptions.toLocaleString('es-CO')}
            sublabel={`${totals.canceledSubscriptions} canceladas`}
          />
          <Stat
            icon={Clock}
            label="Pagos pendientes"
            value={totals.pendingPayments.toLocaleString('es-CO')}
            sublabel="Por revisar"
          />
          <Stat
            icon={Tag}
            label="Códigos activos"
            value={totals.activeDiscountCodes.toLocaleString('es-CO')}
            sublabel={`de ${totals.totalDiscountCodes} creados`}
          />
          <Stat
            icon={Wallet}
            label="Ingresos este mes"
            value={cop(totals.revenueThisMonth)}
            sublabel="Pagos aprobados"
          />
          <Stat
            icon={Wallet}
            label="Ingresos totales"
            value={cop(totals.totalRevenue)}
            sublabel="Histórico aprobado"
          />
          <Stat
            icon={FileText}
            label="Cotizaciones"
            value={totals.totalQuotations.toLocaleString('es-CO')}
            sublabel="Generadas"
          />
          <Stat
            icon={Receipt}
            label="Cuentas de cobro"
            value={totals.totalInvoices.toLocaleString('es-CO')}
            sublabel="Generadas"
          />
          <Stat
            icon={Receipt}
            label="Gastos / ingresos"
            value={totals.totalExpenseRecords.toLocaleString('es-CO')}
            sublabel="Movimientos"
          />
        </div>
      </Panel>

      <Panel title="Actividad de la semana" icon={TrendingUp}>
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/8">
          <div className="lg:flex-1 lg:pr-6 pb-6 lg:pb-0">
            <PillBarChart
              label="Registros"
              data={weeklySignups}
              formatValue={(v) => `${v} usuarios`}
            />
          </div>
          <div className="lg:flex-1 lg:px-6 py-6 lg:py-0">
            <PillBarChart
              label="Ingresos aprobados"
              data={weeklyRevenue}
              formatValue={(v) => cop(v)}
            />
          </div>
          <div className="lg:flex-1 lg:pl-6 pt-6 lg:pt-0">
            <PaymentStatusChart
              pending={totals.pendingPayments}
              approved={totals.approvedCount}
              rejected={totals.rejectedCount}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Actividad reciente" icon={UserPlus}>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-6 divide-y lg:divide-y-0 lg:divide-x divide-white/8">
          <div className="lg:pr-6">
            <p className="text-[12px] font-medium text-white/40 mb-2">Últimos registros</p>
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

          <div className="lg:pl-6 pt-6 lg:pt-0">
            <p className="text-[12px] font-medium text-white/40 mb-2">Códigos más usados</p>
            {topDiscountCodes.length === 0 ? (
              <p className="text-sm text-white/40">Sin uso registrado aún.</p>
            ) : (
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
            )}
          </div>
        </div>
      </Panel>

      <SecurityFab onClick={() => setSecurityOpen(true)} />
      {securityOpen && <SecurityModal onClose={() => setSecurityOpen(false)} />}
    </div>
  )
}