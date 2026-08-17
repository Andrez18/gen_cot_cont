'use client'

interface PillBarChartProps {
  label: string
  data: { key: string; value: number }[]
  formatValue?: (v: number) => string
  accent?: 'black' | 'white'
}

export function PillBarChart({ label, data, formatValue, accent = 'black' }: PillBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const barColor = accent === 'black' ? 'bg-black' : 'bg-white'

  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 bg-black/2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
        </div>
        <span className="text-[13px] font-medium text-black/45">{label}</span>
      </div>

      <div className="p-6 pt-8">
        <div className="flex items-end justify-between gap-2.5 sm:gap-3.5 h-40">
          {data.map((d) => {
            const heightPct = Math.max(10, (d.value / max) * 100)
            return (
              <div key={d.key} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                <div
                  className={`w-full max-w-9 rounded-full ${barColor} transition-all duration-500`}
                  style={{ height: `${heightPct}%` }}
                  title={formatValue ? formatValue(d.value) : String(d.value)}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2.5 sm:gap-3.5">
          {data.map((d) => (
            <span key={d.key} className="flex-1 text-center text-[11px] font-medium text-black/35">
              {d.key}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
