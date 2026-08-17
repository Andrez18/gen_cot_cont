'use client'

interface PaymentStatusChartProps {
  pending: number
  approved: number
  rejected: number
}

export function PaymentStatusChart({ pending, approved, rejected }: PaymentStatusChartProps) {
  const total = pending + approved + rejected
  if (total === 0) {
    return (
      <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6">
        <h2 className="text-[15px] font-semibold mb-3">Estado de pagos</h2>
        <p className="text-sm text-white/40">Sin pagos registrados aún.</p>
      </div>
    )
  }

  const segments = [
    { label: 'Pendientes', value: pending, color: 'bg-amber-400' },
    { label: 'Aprobados', value: approved, color: 'bg-emerald-400' },
    { label: 'Rechazados', value: rejected, color: 'bg-red-400' },
  ].filter((s) => s.value > 0)

  return (
    <div className="rounded-3xl border border-white/8 bg-linear-to-b from-white/4.5 to-white/1.5 p-6">
      <h2 className="text-[15px] font-semibold mb-4">Estado de pagos</h2>

      {/* Barra segmentada horizontal */}
      <div className="flex h-5 rounded-full overflow-hidden bg-white/5">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`${s.color} transition-all duration-500`}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span className="text-white/55">
              {s.label}: <span className="font-semibold text-white/80">{s.value}</span> ({Math.round((s.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
