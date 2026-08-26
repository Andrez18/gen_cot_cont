'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckCircle2, CircleDollarSign, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { useWorkerLoans } from '@/hooks/use-worker-loans'
import { useNotification } from '@/hooks/use_notification'
import { formatCurrency } from '@/lib/document-utils'

interface LoanDraft {
  worker_name: string
  amount: string
  loan_date: string
  reason: string
  notes: string
}

const emptyDraft = (): LoanDraft => ({
  worker_name: '',
  amount: '',
  loan_date: new Date().toISOString().split('T')[0],
  reason: '',
  notes: '',
})

const inputStyle = 'border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full'

export function WorkerLoansForm() {
  const { success, error: notifError, loading, dismiss } = useNotification()
  const { loans, addLoan, markAsPaid, deleteLoan, isLoaded, totalPending, totalPaid } = useWorkerLoans()
  const [draft, setDraft] = useState<LoanDraft>(emptyDraft())
  const [isSaving, setIsSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const setField = (field: keyof LoanDraft, value: string) =>
    setDraft(prev => ({ ...prev, [field]: value }))

  const handleAdd = async () => {
    if (!draft.worker_name.trim() || !draft.amount) return

    const tid = loading('Guardando préstamo...')
    setIsSaving(true)
    try {
      const { error } = await addLoan({
        worker_name: draft.worker_name.trim(),
        amount: Number(draft.amount),
        loan_date: draft.loan_date,
        reason: draft.reason.trim() || null,
        notes: draft.notes.trim() || null,
      })
      dismiss(tid)
      if (error) { notifError('Error', error.message); return }
      success('Préstamo registrado', `${draft.worker_name.trim()} - ${formatCurrency(Number(draft.amount))}`)
      setDraft(emptyDraft())
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkPaid = async (id: string, name: string) => {
    const tid = loading('Marcando como pagado...')
    const { error } = await markAsPaid(id)
    dismiss(tid)
    if (error) { notifError('Error', error.message); return }
    success('Préstamo pagado', name)
  }

  const handleDelete = async (id: string, name: string) => {
    const { error } = await deleteLoan(id)
    if (error) { notifError('Error eliminando', error.message) }
    else success('Eliminado', name)
  }

  const filtered = loans.filter(l => {
    if (filter !== 'all' && l.status !== filter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      return l.worker_name.toLowerCase().includes(q) ||
        (l.reason ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const statusColor = (status: string) =>
    status === 'paid'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-10 space-y-8">

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg border border-border bg-secondary flex items-center justify-center">
            <CircleDollarSign size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Préstamos a Trabajadores</h1>
            <p className="text-sm text-muted-foreground">Registra y da seguimiento a préstamos</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Pendiente por cobrar</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total pagado</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
        </div>

        {/* Add Form */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Nuevo préstamo</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre del trabajador *</Label>
              <input
                className={inputStyle}
                placeholder="Ej. Carlos Pérez"
                value={draft.worker_name}
                onChange={e => setField('worker_name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Monto (COP) *</Label>
              <input
                className={inputStyle}
                type="number"
                min="0"
                placeholder="0"
                value={draft.amount}
                onChange={e => setField('amount', e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fecha del préstamo</Label>
              <input
                className={inputStyle}
                type="date"
                value={draft.loan_date}
                onChange={e => setField('loan_date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Motivo</Label>
              <input
                className={inputStyle}
                placeholder="Ej. Anticipo, emergencia..."
                value={draft.reason}
                onChange={e => setField('reason', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notas</Label>
            <input
              className={inputStyle}
              placeholder="Observaciones adicionales"
              value={draft.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </div>

          <Button
            onClick={handleAdd}
            disabled={!draft.worker_name.trim() || !draft.amount || isSaving}
            className="gap-2"
            size="sm"
          >
            <Plus size={14} />
            Registrar préstamo
          </Button>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar trabajador..."
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {(['all', 'pending', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Pagados'}
              </button>
            ))}
          </div>
        </div>

        {/* Loans List */}
        {!isLoaded ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <CircleDollarSign size={24} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {loans.length === 0 ? 'No hay préstamos registrados' : 'No hay resultados para tu búsqueda'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Préstamos ({filtered.length})</h2>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {filtered.map(loan => (
                <div key={loan.id} className="flex items-center gap-4 px-5 py-4 bg-background">
                  <div className="size-9 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                    {loan.worker_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{loan.worker_name}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(loan.status)}`}>
                        {loan.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {loan.reason ? `${loan.reason} · ` : ''}
                      {new Date(loan.loan_date).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(loan.amount))}</p>
                    {loan.paid_date && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Pagado {new Date(loan.paid_date).toLocaleDateString('es-CO')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {loan.status === 'pending' && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-500/10"
                        title="Marcar como pagado"
                        onClick={() => handleMarkPaid(loan.id, loan.worker_name)}
                      >
                        <CheckCircle2 size={15} />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(loan.id, loan.worker_name)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
