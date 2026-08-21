'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Wallet,
  Users,
  CalendarRange,
  Clock,
  FileDown,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  History,
  Save,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { PayrollTutorialModal, PAYROLL_TUTORIAL_KEY } from '@/components/payroll-tutorial-modal'
import {
  usePayrollEmployees,
  usePayrollRuns,
  type PayrollEmployeeRow,
  type PayrollEmployeeDraft,
  type PayrollRunLine,
} from '@/hooks/use-payroll'
import { useNotification } from '@/hooks/use_notification'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { formatCurrency, formatShortDate } from '@/lib/document-utils'
import {
  computeEmployeePayroll,
  computeRunTotals,
  formatPeriodLabel,
  generatePayrollNumber,
  PAYMENT_TYPE_LABELS,
  PAYROLL_CONSTANTS,
  RECARGOS_2026,
  type PayrollLineInput,
  type PayrollLineResult,
  type PayrollPaymentType,
} from '@/lib/payroll'

const inputStyle =
  'border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full'

interface EmployeeFormDraft {
  full_name: string
  document_number: string
  position: string
  payment_type: PayrollPaymentType
  monthly_salary: string
  weekly_rate: string
  daily_rate: string
  hourly_rate: string
  task_rate: string
  transport_aux: boolean
  deduct_health: boolean
  deduct_pension: boolean
}

const emptyEmployeeDraft = (): EmployeeFormDraft => ({
  full_name: '',
  document_number: '',
  position: '',
  payment_type: 'monthly',
  monthly_salary: '',
  weekly_rate: '',
  daily_rate: '',
  hourly_rate: '',
  task_rate: '',
  transport_aux: true,
  deduct_health: true,
  deduct_pension: true,
})

interface LineFields {
  daysWorked: string
  hoursWorked: string
  /** Días festivos/dominicales trabajados y pago por día (editable). */
  holidayDaysWorked: string
  holidayDayRate: string
  extraDayHours: string
  extraNightHours: string
  nightOvertimeHours: string
  bonuses: string
  otherDeductions: string
}

const emptyLineFields = (): LineFields => ({
  daysWorked: '',
  hoursWorked: '',
  holidayDaysWorked: '',
  holidayDayRate: String(PAYROLL_CONSTANTS.PAGO_FESTIVO_DEFAULT),
  extraDayHours: '',
  extraNightHours: '',
  nightOvertimeHours: '',
  bonuses: '',
  otherDeductions: '',
})

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '')
  return isFinite(n) && n > 0 ? n : 0
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Por defecto sugiere la quincena en curso. */
function defaultPeriod(): { start: string; end: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  return now.getDate() <= 15
    ? { start: iso(new Date(y, m, 1)), end: iso(new Date(y, m, 15)) }
    : { start: iso(new Date(y, m, 16)), end: iso(new Date(y, m, lastDay)) }
}

const COMPANY_KEY = 'cotifactura_payroll_company'

interface PdfPayload {
  number: string
  /** Nombre visible de la liquidación; si falta se usa el código. */
  name?: string
  periodLabel: string
  companyName: string
  companyNit: string
  lines: Array<{
    fullName: string
    documentNumber?: string | null
    position?: string | null
    paymentType: PayrollPaymentType
    daysWorked?: number
    hoursWorked?: number
    result: PayrollLineResult
  }>
}

/* ================================================================
   COMPONENTE PRINCIPAL
================================================================ */

export function PayrollForm() {
  const { success, error: notifError } = useNotification()
  const { generatePdfNoBreak, isGenerating } = usePdfGenerator()
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    isLoaded: employeesLoaded,
  } = usePayrollEmployees()
  const { runs, saveRun, deleteRun, hasMore, isLoadingMore, loadMore } = usePayrollRuns()

  /* ── estado general ─────────────────────────────────────────────────── */
  const [showTutorial, setShowTutorial] = useState(false)
  const initialPeriod = useMemo(() => defaultPeriod(), [])
  const [periodStart, setPeriodStart] = useState(initialPeriod.start)
  const [periodEnd, setPeriodEnd] = useState(initialPeriod.end)
  const [companyName, setCompanyName] = useState('')
  const [companyNit, setCompanyNit] = useState('')
  const [runNumber, setRunNumber] = useState('')
  /* Nombre visible de la liquidación; editable por el usuario */
  const [runName, setRunName] = useState('')
  const [runNameTouched, setRunNameTouched] = useState(false)

  /* ── alta/edición de trabajadores ───────────────────────────────────── */
  const [draft, setDraft] = useState<EmployeeFormDraft>(emptyEmployeeDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EmployeeFormDraft>(emptyEmployeeDraft())
  const [isSavingEmployee, setIsSavingEmployee] = useState(false)

  /* ── liquidación por trabajador ─────────────────────────────────────── */
  const [lineFields, setLineFields] = useState<Record<string, LineFields>>({})
  const [openExtrasId, setOpenExtrasId] = useState<string | null>(null)
  const [openDetailId, setOpenDetailId] = useState<string | null>(null)

  /* ── guardado y PDF ─────────────────────────────────────────────────── */
  const [isSavingRun, setIsSavingRun] = useState(false)
  const [pdfData, setPdfData] = useState<PdfPayload | null>(null)

  /* Tutorial solo la primera vez que entra a la función */
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.localStorage.getItem(PAYROLL_TUTORIAL_KEY)) {
      setShowTutorial(true)
    }
    setRunNumber(generatePayrollNumber())
  }, [])

  /* Datos de la empresa recordados entre sesiones */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPANY_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.companyName) setCompanyName(saved.companyName)
        if (saved.companyNit) setCompanyNit(saved.companyNit)
      }
    } catch {
      /* ignorar */
    }
  }, [])

  const defaultPeriodDays = useMemo(() => {
    const s = new Date(`${periodStart}T00:00:00`).getTime()
    const e = new Date(`${periodEnd}T00:00:00`).getTime()
    if (!isFinite(s) || !isFinite(e) || e < s) return 30
    return Math.min(30, Math.round((e - s) / 86_400_000) + 1)
  }, [periodStart, periodEnd])

  /* Inicializar campos de liquidación para empleados nuevos */
  useEffect(() => {
    setLineFields(prev => {
      const next = { ...prev }
      let changed = false
      for (const e of employees) {
        if (!next[e.id]) {
          next[e.id] = emptyLineFields()
          next[e.id].daysWorked = String(defaultPeriodDays)
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees])

  const periodLabel = useMemo(
    () => formatPeriodLabel(periodStart, periodEnd),
    [periodStart, periodEnd],
  )

  /* Nombre por defecto "Nómina {periodo}"; se regenera con el periodo
     salvo que el usuario haya escrito uno propio. */
  useEffect(() => {
    if (!runNameTouched && periodLabel) {
      setRunName(`Nómina ${periodLabel}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodLabel])

  const activeEmployees = useMemo(() => employees.filter(e => e.active), [employees])

  /* Resultados calculados en vivo */
  const resultsById = useMemo(() => {
    const map: Record<string, PayrollLineResult> = {}
    for (const e of activeEmployees) {
      const f = lineFields[e.id] ?? emptyLineFields()
      const input: PayrollLineInput = {
        employeeId: e.id,
        fullName: e.full_name,
        documentNumber: e.document_number,
        position: e.position,
        paymentType: e.payment_type,
        monthlySalary: e.monthly_salary,
        weeklyRate: e.weekly_rate,
        dailyRate: e.daily_rate,
        hourlyRate: e.hourly_rate,
        taskRate: e.task_rate,
        transportAux: e.transport_aux,
        deductHealth: e.deduct_health !== false,
        deductPension: e.deduct_pension !== false,
        daysWorked: num(f.daysWorked),
        hoursWorked: num(f.hoursWorked),
        holidayDaysWorked: num(f.holidayDaysWorked),
        holidayDayRate:
          f.holidayDayRate == null || f.holidayDayRate.trim() === ''
            ? undefined
            : Number(f.holidayDayRate),
        extraDayHours: num(f.extraDayHours),
        extraNightHours: num(f.extraNightHours),
        nightOvertimeHours: num(f.nightOvertimeHours),
        bonuses: num(f.bonuses),
        otherDeductions: num(f.otherDeductions),
      }
      map[e.id] = computeEmployeePayroll(input)
    }
    return map
  }, [activeEmployees, lineFields])

  const totals = useMemo(
    () => computeRunTotals(activeEmployees.map(e => resultsById[e.id]).filter(Boolean)),
    [activeEmployees, resultsById],
  )

  /* ── manejadores de trabajadores ────────────────────────────────────── */

  const validateDraft = (d: EmployeeFormDraft): string | null => {
    if (!d.full_name.trim()) return 'El nombre del trabajador es obligatorio'
    const rates: Record<PayrollPaymentType, string> = {
      monthly: d.monthly_salary,
      biweekly: d.monthly_salary,
      weekly: d.weekly_rate,
      daily: d.daily_rate,
      hourly: d.hourly_rate,
      per_task: d.task_rate,
    }
    if (num(rates[d.payment_type]) <= 0) {
      const field =
        d.payment_type === 'per_task'
          ? 'el valor de la obra/tarea'
          : `la tarifa (${PAYMENT_TYPE_LABELS[d.payment_type]})`
      return `Ingresa ${field}`
    }
    return null
  }

  const toDbDraft = (d: EmployeeFormDraft): PayrollEmployeeDraft => ({
    full_name: d.full_name.trim(),
    document_number: d.document_number.trim() || null,
    position: d.position.trim() || null,
    payment_type: d.payment_type,
    monthly_salary:
      d.payment_type === 'monthly' || d.payment_type === 'biweekly'
        ? num(d.monthly_salary) || null
        : null,
    weekly_rate: d.payment_type === 'weekly' ? num(d.weekly_rate) || null : null,
    daily_rate: d.payment_type === 'daily' ? num(d.daily_rate) || null : null,
    hourly_rate: d.payment_type === 'hourly' ? num(d.hourly_rate) || null : null,
    task_rate: d.payment_type === 'per_task' ? num(d.task_rate) || null : null,
    transport_aux: d.transport_aux,
    deduct_health: d.deduct_health,
    deduct_pension: d.deduct_pension,
    active: true,
  })

  const employeeToDraft = (e: PayrollEmployeeRow): EmployeeFormDraft => ({
    full_name: e.full_name,
    document_number: e.document_number ?? '',
    position: e.position ?? '',
    payment_type: e.payment_type,
    monthly_salary: e.monthly_salary != null ? String(e.monthly_salary) : '',
    weekly_rate: e.weekly_rate != null ? String(e.weekly_rate) : '',
    daily_rate: e.daily_rate != null ? String(e.daily_rate) : '',
    hourly_rate: e.hourly_rate != null ? String(e.hourly_rate) : '',
    task_rate: e.task_rate != null ? String(e.task_rate) : '',
    transport_aux: e.transport_aux,
    deduct_health: e.deduct_health !== false,
    deduct_pension: e.deduct_pension !== false,
  })

  const handleAddEmployee = async () => {
    const problem = validateDraft(draft)
    if (problem) {
      notifError('Datos incompletos', problem)
      return
    }
    setIsSavingEmployee(true)
    const { error } = await addEmployee(toDbDraft(draft))
    setIsSavingEmployee(false)
    if (error) {
      notifError('Error', error.message)
      return
    }
    success('Trabajador agregado', draft.full_name.trim())
    setDraft(emptyEmployeeDraft())
  }

  const handleSaveEdit = async (id: string) => {
    const problem = validateDraft(editDraft)
    if (problem) {
      notifError('Datos incompletos', problem)
      return
    }
    const { error } = await updateEmployee(id, toDbDraft(editDraft))
    if (error) {
      notifError('Error', error.message)
      return
    }
    success('Trabajador actualizado', editDraft.full_name.trim())
    setEditingId(null)
  }

  const handleDeleteEmployee = async (e: PayrollEmployeeRow) => {
    const { error } = await deleteEmployee(e.id)
    if (error) notifError('Error eliminando', error.message)
    else success('Trabajador eliminado', e.full_name)
  }

  /* ── campos de liquidación ──────────────────────────────────────────── */

  const setLineField = (employeeId: string, field: keyof LineFields, value: string) =>
    setLineFields(prev => ({
      ...prev,
      [employeeId]: { ...(prev[employeeId] ?? emptyLineFields()), [field]: value },
    }))

  /* ── guardar la nómina ──────────────────────────────────────────────── */

  const buildLines = (): PayrollRunLine[] =>
    activeEmployees.map(e => {
      const f = lineFields[e.id] ?? emptyLineFields()
      const input: PayrollLineInput = {
        employeeId: e.id,
        fullName: e.full_name,
        documentNumber: e.document_number,
        position: e.position,
        paymentType: e.payment_type,
        monthlySalary: e.monthly_salary,
        weeklyRate: e.weekly_rate,
        dailyRate: e.daily_rate,
        hourlyRate: e.hourly_rate,
        taskRate: e.task_rate,
        transportAux: e.transport_aux,
        deductHealth: e.deduct_health !== false,
        deductPension: e.deduct_pension !== false,
        daysWorked: num(f.daysWorked),
        hoursWorked: num(f.hoursWorked),
        holidayDaysWorked: num(f.holidayDaysWorked),
        holidayDayRate:
          f.holidayDayRate == null || f.holidayDayRate.trim() === ''
            ? undefined
            : Number(f.holidayDayRate),
        extraDayHours: num(f.extraDayHours),
        extraNightHours: num(f.extraNightHours),
        nightOvertimeHours: num(f.nightOvertimeHours),
        bonuses: num(f.bonuses),
        otherDeductions: num(f.otherDeductions),
      }
      return { ...input, result: resultsById[e.id] }
    })

  const handleSaveRun = async () => {
    if (activeEmployees.length === 0) {
      notifError('Nómina vacía', 'Agrega al menos un trabajador activo')
      return
    }
    if (totals.totalDevengados <= 0) {
      notifError('Sin devengados', 'Registra los días u horas trabajadas del periodo')
      return
    }

    setIsSavingRun(true)
    const { data, error } = await saveRun({
      number: runNumber,
      name: runName.trim() || null,
      period_start: periodStart,
      period_end: periodEnd,
      period_label: periodLabel || null,
      company_name: companyName.trim() || null,
      company_nit: companyNit.trim() || null,
      employee_count: activeEmployees.length,
      total_devengados: totals.totalDevengados,
      total_deducciones: totals.totalDeducciones,
      total_neto: totals.totalNeto,
      lines: buildLines(),
      notes: null,
    })
    setIsSavingRun(false)

    if (error || !data) {
      notifError('Error al guardar', error?.message ?? 'Intenta de nuevo')
      return
    }

    window.localStorage.setItem(
      COMPANY_KEY,
      JSON.stringify({ companyName: companyName.trim(), companyNit: companyNit.trim() }),
    )
    success('Nómina guardada', `${runName.trim() || runNumber} · ${periodLabel}`)
    // Preparar la siguiente liquidación con nombre y código nuevos
    setRunNumber(generatePayrollNumber())
    setRunNameTouched(false)
    setRunName(`Nómina ${periodLabel}`)
  }

  /* ── PDF ────────────────────────────────────────────────────────────── */

  const triggerPdf = (payload: PdfPayload) => {
    setPdfData(payload)
    setTimeout(() => {
      generatePdfNoBreak('payroll-pdf-preview', `Nomina-${payload.number}`).catch(() =>
        notifError('Error', 'No se pudo generar el PDF'),
      )
    }, 300)
  }

  const handleDownloadCurrent = () => {
    if (activeEmployees.length === 0) {
      notifError('Nómina vacía', 'Agrega al menos un trabajador activo')
      return
    }
    triggerPdf({
      number: runNumber,
      name: runName.trim(),
      periodLabel,
      companyName: companyName.trim(),
      companyNit: companyNit.trim(),
      lines: buildLines().map(l => ({
        fullName: l.fullName,
        documentNumber: l.documentNumber ?? null,
        position: l.position ?? null,
        paymentType: l.paymentType,
        daysWorked: l.daysWorked,
        hoursWorked: l.hoursWorked,
        result: l.result,
      })),
    })
  }

  const handleDownloadRun = (runId: string) => {
    const run = runs.find(r => r.id === runId)
    if (!run) return
    triggerPdf({
      number: run.number,
      name: run.name ?? '',
      periodLabel: run.period_label ?? formatPeriodLabel(run.period_start, run.period_end),
      companyName: run.company_name ?? '',
      companyNit: run.company_nit ?? '',
      lines: (run.lines ?? []).map(l => ({
        fullName: l.fullName,
        documentNumber: l.documentNumber ?? null,
        position: l.position ?? null,
        paymentType: l.paymentType,
        daysWorked: l.daysWorked,
        hoursWorked: l.hoursWorked,
        result: l.result,
      })),
    })
  }

  const handleDeleteRun = async (runId: string) => {
    const { error } = await deleteRun(runId)
    if (error) notifError('Error', error.message)
    else success('Liquidación eliminada', '')
  }

  /* ================================================================
     RENDER
  ================================================================ */

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <PayrollTutorialModal open={showTutorial} onOpenChange={setShowTutorial} />

      <main className="flex-1 max-w-[820px] mx-auto w-full px-4 py-10 space-y-8">
        {/* Título */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Nómina</h1>
            <p className="text-sm text-muted-foreground">
              Liquida el pago de tus trabajadores con la normativa colombiana vigente
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setShowTutorial(true)}
          >
            <History className="size-4" />
            Ver tutorial
          </Button>
        </div>

        {/* ── Periodo ───────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarRange size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-medium">Periodo de liquidación</h2>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desde *</Label>
              <input
                type="date"
                className={inputStyle}
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hasta *</Label>
              <input
                type="date"
                className={inputStyle}
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Empresa</Label>
              <input
                className={inputStyle}
                placeholder="Tu empresa (opcional)"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">NIT / CC</Label>
              <input
                className={inputStyle}
                placeholder="Opcional"
                value={companyNit}
                onChange={e => setCompanyNit(e.target.value)}
              />
            </div>
          </div>
          {periodLabel && (
            <p className="text-xs text-muted-foreground">
              Periodo: <span className="font-medium text-foreground">{periodLabel}</span> ·{' '}
              {defaultPeriodDays} día(s) base
            </p>
          )}
        </section>

        {/* ── Trabajadores ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-medium">Trabajadores ({employees.length})</h2>
          </div>

          {/* Alta */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre completo *</Label>
                <input
                  className={inputStyle}
                  placeholder="Ej. María Gómez"
                  value={draft.full_name}
                  onChange={e => setDraft({ ...draft, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Documento</Label>
                <input
                  className={inputStyle}
                  placeholder="CC 1.000.000.000"
                  value={draft.document_number}
                  onChange={e => setDraft({ ...draft, document_number: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cargo</Label>
                <input
                  className={inputStyle}
                  placeholder="Ej. Oficial, auxiliar..."
                  value={draft.position}
                  onChange={e => setDraft({ ...draft, position: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Forma de pago *</Label>
                <select
                  className={inputStyle}
                  value={draft.payment_type}
                  onChange={e =>
                    setDraft({ ...draft, payment_type: e.target.value as PayrollPaymentType })
                  }
                >
                  {(Object.keys(PAYMENT_TYPE_LABELS) as PayrollPaymentType[]).map(t => (
                    <option key={t} value={t}>
                      {PAYMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {(draft.payment_type === 'monthly' || draft.payment_type === 'biweekly') && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Sueldo mensual (COP) *</Label>
                  <input
                    className={inputStyle}
                    type="number"
                    min="0"
                    placeholder={
                      draft.payment_type === 'biweekly'
                        ? 'Mensual; se paga por quincena'
                        : String(PAYROLL_CONSTANTS.SMLMV_2026)
                    }
                    value={draft.monthly_salary}
                    onChange={e => setDraft({ ...draft, monthly_salary: e.target.value })}
                  />
                </div>
              )}
              {draft.payment_type === 'weekly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pago por semana (COP) *</Label>
                  <input
                    className={inputStyle}
                    type="number"
                    min="0"
                    placeholder="Ej. 210000"
                    value={draft.weekly_rate}
                    onChange={e => setDraft({ ...draft, weekly_rate: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Se liquida proporcional a los días trabajados (semana de 6 días).
                  </p>
                </div>
              )}
              {draft.payment_type === 'daily' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pago por día (COP) *</Label>
                  <input
                    className={inputStyle}
                    type="number"
                    min="0"
                    placeholder="Ej. 70000"
                    value={draft.daily_rate}
                    onChange={e => setDraft({ ...draft, daily_rate: e.target.value })}
                  />
                </div>
              )}
              {draft.payment_type === 'hourly' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Pago por hora (COP) *</Label>
                  <input
                    className={inputStyle}
                    type="number"
                    min="0"
                    placeholder="Ej. 10000"
                    value={draft.hourly_rate}
                    onChange={e => setDraft({ ...draft, hourly_rate: e.target.value })}
                  />
                </div>
              )}
              {draft.payment_type === 'per_task' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Valor obra / tarea (COP) *</Label>
                  <input
                    className={inputStyle}
                    type="number"
                    min="0"
                    placeholder="Acordado para el periodo"
                    value={draft.task_rate}
                    onChange={e => setDraft({ ...draft, task_rate: e.target.value })}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-end gap-x-5 gap-y-2 pb-1.5 text-sm">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--foreground)]"
                    checked={draft.transport_aux}
                    onChange={e => setDraft({ ...draft, transport_aux: e.target.checked })}
                  />
                  <span className="text-muted-foreground">
                    Auxilio de transporte{' '}
                    <span className="text-xs">(si gana ≤ 2 SMLMV)</span>
                  </span>
                </label>
                <label
                  className="flex items-center gap-2 cursor-pointer select-none"
                  title="Desmarca si el trabajador ya tiene EPS cubierta por otra parte"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--foreground)]"
                    checked={draft.deduct_health}
                    onChange={e => setDraft({ ...draft, deduct_health: e.target.checked })}
                  />
                  <span className="text-muted-foreground">
                    Descontar salud (4 %)
                  </span>
                </label>
                <label
                  className="flex items-center gap-2 cursor-pointer select-none"
                  title="Desmarca si el trabajador ya tiene pensión cubierta (también quita el FSP)"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--foreground)]"
                    checked={draft.deduct_pension}
                    onChange={e => setDraft({ ...draft, deduct_pension: e.target.checked })}
                  />
                  <span className="text-muted-foreground">
                    Descontar pensión (4 %)
                  </span>
                </label>
              </div>
            </div>

            <Button onClick={handleAddEmployee} disabled={isSavingEmployee} size="sm" className="gap-2">
              <Plus size={14} />
              Agregar trabajador
            </Button>
          </div>

          {/* Lista */}
          {!employeesLoaded ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cargando...</p>
          ) : employees.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <Users size={24} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Aún no hay trabajadores registrados
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {employees.map(emp => {
                const result = resultsById[emp.id]
                return (
                  <div key={emp.id} className="bg-background">
                    {editingId === emp.id ? (
                      /* ── fila de edición ── */
                      <div className="p-4 space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Nombre</Label>
                            <input
                              className={inputStyle}
                              value={editDraft.full_name}
                              onChange={e => setEditDraft({ ...editDraft, full_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Documento</Label>
                            <input
                              className={inputStyle}
                              value={editDraft.document_number}
                              onChange={e =>
                                setEditDraft({ ...editDraft, document_number: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Cargo</Label>
                            <input
                              className={inputStyle}
                              value={editDraft.position}
                              onChange={e => setEditDraft({ ...editDraft, position: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Forma de pago</Label>
                            <select
                              className={inputStyle}
                              value={editDraft.payment_type}
                              onChange={e =>
                                setEditDraft({
                                  ...editDraft,
                                  payment_type: e.target.value as PayrollPaymentType,
                                })
                              }
                            >
                              {(Object.keys(PAYMENT_TYPE_LABELS) as PayrollPaymentType[]).map(t => (
                                <option key={t} value={t}>
                                  {PAYMENT_TYPE_LABELS[t]}
                                </option>
                              ))}
                            </select>
                          </div>
                          {(editDraft.payment_type === 'monthly' ||
                            editDraft.payment_type === 'biweekly') && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Sueldo mensual</Label>
                              <input
                                className={inputStyle}
                                type="number"
                                value={editDraft.monthly_salary}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, monthly_salary: e.target.value })
                                }
                              />
                            </div>
                          )}
                          {editDraft.payment_type === 'weekly' && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Pago por semana</Label>
                              <input
                                className={inputStyle}
                                type="number"
                                value={editDraft.weekly_rate}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, weekly_rate: e.target.value })
                                }
                              />
                            </div>
                          )}
                          {editDraft.payment_type === 'daily' && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Pago por día</Label>
                              <input
                                className={inputStyle}
                                type="number"
                                value={editDraft.daily_rate}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, daily_rate: e.target.value })
                                }
                              />
                            </div>
                          )}
                          {editDraft.payment_type === 'hourly' && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Pago por hora</Label>
                              <input
                                className={inputStyle}
                                type="number"
                                value={editDraft.hourly_rate}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, hourly_rate: e.target.value })
                                }
                              />
                            </div>
                          )}
                          {editDraft.payment_type === 'per_task' && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Valor obra/tarea</Label>
                              <input
                                className={inputStyle}
                                type="number"
                                value={editDraft.task_rate}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, task_rate: e.target.value })
                                }
                              />
                            </div>
                          )}
                          <div className="flex flex-wrap items-end gap-x-4 gap-y-2 pb-1.5 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="size-4 accent-[var(--foreground)]"
                                checked={editDraft.transport_aux}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, transport_aux: e.target.checked })
                                }
                              />
                              <span className="text-muted-foreground">Auxilio de transporte</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="size-4 accent-[var(--foreground)]"
                                checked={editDraft.deduct_health}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, deduct_health: e.target.checked })
                                }
                              />
                              <span className="text-muted-foreground">Descontar salud (4 %)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="size-4 accent-[var(--foreground)]"
                                checked={editDraft.deduct_pension}
                                onChange={e =>
                                  setEditDraft({ ...editDraft, deduct_pension: e.target.checked })
                                }
                              />
                              <span className="text-muted-foreground">Descontar pensión (4 %)</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1" onClick={() => handleSaveEdit(emp.id)}>
                            <Check size={13} /> Guardar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={13} /> Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ── fila normal ── */
                      <div className="flex items-center gap-4 px-5 py-4">
                        <div className="size-8 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0">
                          <Users size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {PAYMENT_TYPE_LABELS[emp.payment_type]}
                            {emp.monthly_salary != null && ` · ${formatCurrency(emp.monthly_salary)}/mes`}
                            {emp.weekly_rate != null && ` · ${formatCurrency(emp.weekly_rate)}/semana`}
                            {emp.daily_rate != null && ` · ${formatCurrency(emp.daily_rate)}/día`}
                            {emp.hourly_rate != null && ` · ${formatCurrency(emp.hourly_rate)}/hora`}
                            {emp.task_rate != null && ` · ${formatCurrency(emp.task_rate)} por obra`}
                            {emp.document_number && ` · ${emp.document_number}`}
                            {(!emp.deduct_health || !emp.deduct_pension) &&
                              ' · sin descuentos de seguridad social'}
                            {!emp.active && ' · inactivo'}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => {
                              setEditingId(emp.id)
                              setEditDraft(employeeToDraft(emp))
                            }}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteEmployee(emp)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Liquidación del periodo ───────────────────────────────────── */}
        {activeEmployees.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <h2 className="text-sm font-medium">Liquidación del periodo</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                SMLMV 2026 {formatCurrency(PAYROLL_CONSTANTS.SMLMV_2026)} · jornada 42 h (divisor{' '}
                {PAYROLL_CONSTANTS.HORAS_MES})
              </p>
            </div>

            {activeEmployees.map(emp => {
              const r = resultsById[emp.id]
              const f = lineFields[emp.id] ?? emptyLineFields()
              const extrasOpen = openExtrasId === emp.id
              const detailOpen = openDetailId === emp.id
              const noHourBase = emp.payment_type === 'per_task'
              return (
                <div key={emp.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                  {/* encabezado */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{emp.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {PAYMENT_TYPE_LABELS[emp.payment_type]}
                        {(() => {
                          const d = num(f.daysWorked)
                          const parts: string[] = []
                          if (d > 0) parts.push(`${d} día${d !== 1 ? 's' : ''}`)
                          if (r.holidayDays > 0) parts.push(`${r.holidayDays} fest.`)
                          return parts.length ? ` · ${parts.join(' + ')}` : ''
                        })()}
                        {r.auxAplica && ' · con auxilio'}
                        {!r.deductHealth && ' · sin salud'}
                        {!r.deductPension && ' · sin pensión'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Neto a pagar</p>
                      <p className="text-base font-semibold">{formatCurrency(r.neto)}</p>
                    </div>
                  </div>

                  {/* días / festivos / horas */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <NumCell
                      label="Días trabajados"
                      value={f.daysWorked}
                      onChange={v => setLineField(emp.id, 'daysWorked', v)}
                    />
                    <NumCell
                      label="Días festivos/dominicales"
                      value={f.holidayDaysWorked}
                      onChange={v => setLineField(emp.id, 'holidayDaysWorked', v)}
                      hint="por día"
                    />
                    <NumCell
                      label="Pago por día festivo (COP)"
                      value={f.holidayDayRate}
                      onChange={v => setLineField(emp.id, 'holidayDayRate', v)}
                      money
                    />
                    {emp.payment_type === 'hourly' && (
                      <NumCell
                        label="Horas ordinarias"
                        value={f.hoursWorked}
                        onChange={v => setLineField(emp.id, 'hoursWorked', v)}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 h-10 px-3 rounded-md border text-sm transition-colors ${
                      extrasOpen
                        ? 'border-foreground/40 bg-muted'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setOpenExtrasId(extrasOpen ? null : emp.id)}
                  >
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-muted-foreground" />
                      Horas extra y otros conceptos
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${extrasOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {extrasOpen && (
                    <div className="space-y-3">
                      {noHourBase && (
                        <p className="text-xs text-muted-foreground">
                          Las horas extra no aplican al pago por obra/tarea.
                        </p>
                      )}
                      <div className="grid sm:grid-cols-4 gap-3">
                        <NumCell
                          label="Extra diurna (h)"
                          value={f.extraDayHours}
                          onChange={v => setLineField(emp.id, 'extraDayHours', v)}
                          hint={`×${RECARGOS_2026.EXTRA_DIURNA}`}
                          disabled={noHourBase}
                        />
                        <NumCell
                          label="Extra nocturna (h)"
                          value={f.extraNightHours}
                          onChange={v => setLineField(emp.id, 'extraNightHours', v)}
                          hint={`×${RECARGOS_2026.EXTRA_NOCTURNA}`}
                          disabled={noHourBase}
                        />
                        <NumCell
                          label="Recargo nocturno ordinario (h)"
                          value={f.nightOvertimeHours}
                          onChange={v => setLineField(emp.id, 'nightOvertimeHours', v)}
                          hint="+35 %"
                          disabled={noHourBase}
                        />
                        <NumCell
                          label="Bonificaciones (COP)"
                          value={f.bonuses}
                          onChange={v => setLineField(emp.id, 'bonuses', v)}
                          money
                        />
                        <NumCell
                          label="Otras deducciones (COP)"
                          value={f.otherDeductions}
                          onChange={v => setLineField(emp.id, 'otherDeductions', v)}
                          money
                        />
                      </div>
                    </div>
                  )}

                  {/* resumen calculado */}
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
                    <Row label="Sueldo básico" value={r.baseSalary} />
                    {r.auxTransporte > 0 && <Row label="Auxilio de transporte" value={r.auxTransporte} />}
                    {r.extras.map(x => (
                      <Row key={x.key} label={`${x.concept} — ${x.hours} h`} value={x.amount} />
                    ))}
                    {r.holidayPay > 0 && (
                      <Row
                        label={`Días festivos (${r.holidayDays} × ${formatCurrency(r.holidayRate)})`}
                        value={r.holidayPay}
                      />
                    )}
                    {r.bonuses > 0 && <Row label="Bonificaciones" value={r.bonuses} />}
                    <Row label="Total devengado" value={r.totalDevengados} strong />
                    {r.deductHealth ? (
                      <Row label="Salud (4 %)" value={-r.salud} />
                    ) : (
                      <NoApplyRow
                        label="Salud (4 %)"
                        visible={r.totalDevengados > 0}
                        reason="ya cubierta por el trabajador"
                      />
                    )}
                    {r.deductPension ? (
                      <>
                        <Row label="Pensión (4 %)" value={-r.pension} />
                        {r.fsp > 0 && <Row label="Fondo de solidaridad pensional" value={-r.fsp} />}
                      </>
                    ) : (
                      <NoApplyRow
                        label="Pensión (4 %) y FSP"
                        visible={r.totalDevengados > 0}
                        reason="ya cubierta por el trabajador"
                      />
                    )}
                    {r.otherDeductions > 0 && <Row label="Otras deducciones" value={-r.otherDeductions} />}
                    <Row label="Total deducciones" value={-r.totalDeducciones} strong />
                    <div className="border-t border-border pt-1.5 mt-1.5">
                      <Row label="Neto a pagar" value={r.neto} strong large />
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2"
                      onClick={() => setOpenDetailId(detailOpen ? null : emp.id)}
                    >
                      <ChevronDown
                        size={12}
                        className={`transition-transform ${detailOpen ? 'rotate-180' : ''}`}
                      />
                      Ver desglose técnico y prestaciones
                    </button>

                    {detailOpen && (
                      <div className="text-xs text-muted-foreground space-y-1 pt-2">
                        <p>
                          Salario mensualizado: {formatCurrency(r.monthlyEquivalent)} · Valor hora:{' '}
                          {formatCurrency(r.hourValue)}
                        </p>
                        <p>
                          IBC del periodo: {formatCurrency(r.ibc)} (sin auxilio de transporte)
                        </p>
                        {(!r.deductHealth || !r.deductPension) && (
                          <p>
                            Sin descuento de{' '}
                            {[!r.deductHealth && 'salud', !r.deductPension && 'pensión']
                              .filter(Boolean)
                              .join(' ni ')}
                            : el trabajador la cubre por otra parte.
                          </p>
                        )}
                        <p>
                          Prestaciones provisionadas: cesantías {formatCurrency(r.provisions.cesantias)}{' '}
                          · intereses {formatCurrency(r.provisions.interesesCesantias)} · prima{' '}
                          {formatCurrency(r.provisions.prima)} · vacaciones{' '}
                          {formatCurrency(r.provisions.vacaciones)} — total{' '}
                          <span className="font-medium text-foreground">
                            {formatCurrency(r.provisions.total)}
                          </span>{' '}
                          (estimado, no se descuenta del neto)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Totales y acciones */}
            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total devengado</p>
                  <p className="text-base font-semibold">{formatCurrency(totals.totalDevengados)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total deducciones</p>
                  <p className="text-base font-semibold">{formatCurrency(totals.totalDeducciones)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total neto</p>
                  <p className="text-base font-bold">{formatCurrency(totals.totalNeto)}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <Label className="text-xs text-muted-foreground">Nombre de la nómina</Label>
                <input
                  className={inputStyle}
                  placeholder={periodLabel ? `Nómina ${periodLabel}` : 'Nómina'}
                  value={runName}
                  onChange={e => {
                    setRunName(e.target.value)
                    setRunNameTouched(true)
                  }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSaveRun}
                  disabled={isSavingRun || totals.totalDevengados <= 0}
                  className="gap-2 flex-1"
                >
                  <Save size={14} />
                  {isSavingRun ? 'Guardando...' : `Guardar nómina ${runNumber}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadCurrent}
                  disabled={isGenerating || totals.totalDevengados <= 0}
                  className="gap-2 flex-1"
                >
                  <FileDown size={14} />
                  {isGenerating ? 'Generando...' : 'Descargar PDF'}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Cálculos orientativos con los valores legales de 2026: salud y pensión 4 % c/u sobre
                el IBC (desactivables por trabajador), fondo de solidaridad desde 4 SMLMV, valor
                hora con divisor {PAYROLL_CONSTANTS.HORAS_MES} y días festivos pagados por día según
                la tarifa que definas (por defecto{' '}
                {formatCurrency(PAYROLL_CONSTANTS.PAGO_FESTIVO_DEFAULT)}). No constituye asesoría
                contable o laboral.
              </p>
            </div>
          </section>
        )}

        {/* ── Historial ─────────────────────────────────────────────────── */}
        {runs.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History size={16} className="text-muted-foreground" />
              <h2 className="text-sm font-medium">Liquidaciones guardadas ({runs.length})</h2>
            </div>

            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {runs.map(run => (
                <div key={run.id} className="flex items-center gap-4 px-5 py-4 bg-background">
                  <div className="size-8 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0">
                    <Wallet size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {run.name?.trim() || run.number}
                      {run.company_name ? ` · ${run.company_name}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {run.number} ·{' '}
                      {run.period_label ?? `${run.period_start} – ${run.period_end}`} ·{' '}
                      {run.employee_count} trab. · neto {formatCurrency(Number(run.total_neto))} ·{' '}
                      {formatShortDate(run.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      title="Descargar PDF"
                      onClick={() => handleDownloadRun(run.id)}
                    >
                      <FileDown size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 text-destructive hover:text-destructive"
                      title="Eliminar"
                      onClick={() => handleDeleteRun(run.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Cargando...' : 'Cargar más'}
              </Button>
            )}
          </section>
        )}
      </main>

      {/* ── Vista oculta para capturar el PDF ───────────────────────────── */}
      {pdfData && <PayrollPdfPreview id="payroll-pdf-preview" data={pdfData} />}
    </div>
  )
}

/* ── subcomponentes pequeños ─────────────────────────────────────────── */

function NumCell({
  label,
  value,
  onChange,
  hint,
  money,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  money?: boolean
  disabled?: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground leading-tight block">
        {label}
        {hint && <span className="ml-1 opacity-70">({hint})</span>}
      </Label>
      <input
        className={inputStyle}
        type="number"
        min="0"
        disabled={disabled}
        placeholder={money ? '0' : '0 h'}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Row({
  label,
  value,
  strong,
  large,
}: {
  label: string
  value: number
  strong?: boolean
  large?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? 'font-medium text-foreground' : 'text-muted-foreground'}>
        {label}
      </span>
      <span
        className={[
          strong ? 'font-medium text-foreground' : 'text-foreground',
          large ? 'text-base font-bold' : '',
          value < 0 ? 'text-destructive' : '',
        ].join(' ')}
      >
        {formatCurrency(value)}
      </span>
    </div>
  )
}

/** Fila informativa para un descuento que no se aplica (ya cubierto). */
function NoApplyRow({
  label,
  visible,
  reason,
}: {
  label: string
  visible: boolean
  reason: string
}) {
  if (!visible) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="italic text-muted-foreground/60">
        {label} — {reason}
      </span>
      <span className="text-muted-foreground/60">{formatCurrency(0)}</span>
    </div>
  )
}

/* ── plantilla HTML que se convierte a PDF ───────────────────────────── */

function PayrollPdfPreview({ id, data }: { id: string; data: PdfPayload }) {
  const results = data.lines.map(l => l.result)
  const totals = computeRunTotals(results)
  const totalDays = data.lines.reduce((s, l) => s + (l.daysWorked ?? 0), 0)
  const generatedAt = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
      <div
        id={id}
        style={{
          width: 680,
          background: '#fff',
          padding: '40px 48px',
          fontFamily: 'Arial, sans-serif',
          color: '#111',
        }}
      >
        {/* Encabezado */}
        <div data-pdf-block style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em', color: '#888', marginBottom: 6 }}>
            COTIFACTURA
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
                {data.name?.trim() || 'Liquidación de Nómina'}
              </h1>
              <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0' }}>{data.periodLabel}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#555', margin: 0 }}>{data.number}</p>
              {data.companyName && (
                <p style={{ fontSize: 11, color: '#555', margin: '2px 0 0' }}>
                  {data.companyName}
                  {data.companyNit ? ` · NIT/CC ${data.companyNit}` : ''}
                </p>
              )}
              <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>Generada: {generatedAt}</p>
            </div>
          </div>
        </div>

        {/* Resumen general */}
        <table data-pdf-block style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              {['Trabajador', 'Forma de pago', 'Días trabajados', 'Valor por día', 'Neto a pagar'].map(h => (
                <th
                  key={h}
                  align={h === 'Trabajador' || h === 'Forma de pago' ? 'left' : 'right'}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#555',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '6px 4px',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => {
              const days = l.daysWorked ?? 0
              // Nóminas antiguas pueden no traer el campo; se trata como 0
              const fest = l.result.holidayDays ?? 0
              return (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                >
                  <td style={{ fontSize: 12, padding: '8px 4px' }}>
                    {l.fullName}
                    {l.documentNumber ? (
                      <span style={{ color: '#999' }}> · {l.documentNumber}</span>
                    ) : null}
                  </td>
                  <td style={{ fontSize: 12, padding: '8px 4px', color: '#555' }}>
                    {PAYMENT_TYPE_LABELS[l.paymentType]}
                  </td>
                  <td align="right" style={{ fontSize: 12, padding: '8px 4px' }}>
                    {days || '—'}
                    {fest > 0 && (
                      <span style={{ color: '#666' }}>
                        {' '}+{fest} fest.
                      </span>
                    )}
                  </td>
                  <td align="right" style={{ fontSize: 12, padding: '8px 4px' }}>
                    {days > 0 ? formatCurrency(Math.round(l.result.neto / days)) : '—'}
                  </td>
                  <td align="right" style={{ fontSize: 12, padding: '8px 4px', fontWeight: 700 }}>
                    {formatCurrency(l.result.neto)}
                  </td>
                </tr>
              )
            })}
            <tr style={{ borderTop: '2px solid #111' }}>
              <td colSpan={2} style={{ fontSize: 11, fontWeight: 700, padding: '8px 4px' }}>
                TOTALES ({data.lines.length} trabajador{data.lines.length !== 1 ? 'es' : ''})
              </td>
              <td align="right" style={{ fontSize: 12, fontWeight: 700, padding: '8px 4px' }}>
                {(() => {
                  const totalFest = data.lines.reduce((s, l) => s + (l.result.holidayDays ?? 0), 0)
                  return (
                    <>
                      {totalDays || '—'}
                      {totalFest > 0 && (
                        <span style={{ color: '#666', fontWeight: 400 }}>
                          {' '}+{totalFest} fest.
                        </span>
                      )}
                    </>
                  )
                })()}
              </td>
              <td style={{ fontSize: 12, padding: '8px 4px' }} />
              <td align="right" style={{ fontSize: 13, fontWeight: 700, padding: '8px 4px' }}>
                {formatCurrency(totals.totalNeto)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pie */}
        <div
          data-pdf-block
          style={{
            marginTop: 26,
            paddingTop: 14,
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500, margin: 0 }}>
            Generado con CotiFactura · Documento informativo, no reemplaza asesoría contable o laboral.
          </p>
        </div>
      </div>
    </div>
  )
}
