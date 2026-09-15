'use client'

import { Check, FileDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  PAYMENT_TYPE_LABELS,
  PAYROLL_CONSTANTS,
  type PayrollPaymentType,
} from '@/lib/payroll'
import { formatCurrency } from '@/lib/document-utils'
import type { PayrollEmployeeRow } from '@/hooks/use-payroll'

/* ================================================================
   Estado del wizard
   ================================================================ */

const inputStyle =
  'border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full'

export interface NewEmployeeDraft {
  fullName: string
  documentNumber: string
  position: string
  paymentType: PayrollPaymentType
  monthlySalary: string
  weeklyRate: string
  dailyRate: string
  hourlyRate: string
  taskRate: string
  transportAux: boolean
  deductHealth: boolean
  deductPension: boolean
}

export interface LiquidationDraft {
  daysWorked: string
  extraDay: boolean
  holidayDaysWorked: string
  holidayDayRate: string
  extraDayHours: string
  extraNightHours: string
  nightOvertimeHours: string
  bonuses: string
  otherDeductions: string
}

export interface WorkerEntry {
  existingId?: string
  newEmployee?: NewEmployeeDraft
  liquidation: LiquidationDraft
}

export interface WizardState {
  step: number
  periodStart: string
  periodEnd: string
  companyName: string
  companyNit: string
  selectedEmployeeIds: string[]
  newEmployee: NewEmployeeDraft | null
  isCreatingNew: boolean
  liquidationIndex: number
  workers: WorkerEntry[]
}

export const TOTAL_STEPS = 14

export const emptyNewEmployee = (): NewEmployeeDraft => ({
  fullName: '',
  documentNumber: '',
  position: '',
  paymentType: 'monthly',
  monthlySalary: '',
  weeklyRate: '',
  dailyRate: '',
  hourlyRate: '',
  taskRate: '',
  transportAux: true,
  deductHealth: true,
  deductPension: true,
})

export const emptyLiquidation = (): LiquidationDraft => ({
  daysWorked: '',
  extraDay: false,
  holidayDaysWorked: '',
  holidayDayRate: String(PAYROLL_CONSTANTS.PAGO_FESTIVO_DEFAULT),
  extraDayHours: '',
  extraNightHours: '',
  nightOvertimeHours: '',
  bonuses: '',
  otherDeductions: '',
})

export const initialWizardState = (periodStart: string, periodEnd: string): WizardState => ({
  step: 0,
  periodStart,
  periodEnd,
  companyName: '',
  companyNit: '',
  selectedEmployeeIds: [],
  newEmployee: null,
  isCreatingNew: false,
  liquidationIndex: 0,
  workers: [],
})

/* ================================================================
   Helper
   ================================================================ */

const num = (v: string): number => {
  const n = parseFloat(v ?? '')
  return isFinite(n) && n > 0 ? n : 0
}

/* ================================================================
   STEP 0: Periodo
   ================================================================ */

export function StepPeriodo({
  state,
  onChange,
  onNext,
}: {
  state: WizardState
  onChange: (s: Partial<WizardState>) => void
  onNext: () => void
}) {
  const valid = state.periodStart && state.periodEnd && state.periodEnd >= state.periodStart
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Fecha de inicio *</Label>
        <input
          type="date"
          className={inputStyle}
          value={state.periodStart}
          onChange={e => onChange({ periodStart: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Fecha de fin *</Label>
        <input
          type="date"
          className={inputStyle}
          value={state.periodEnd}
          onChange={e => onChange({ periodEnd: e.target.value })}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Se liquidarán {Math.min(30, Math.round(
          (new Date(`${state.periodEnd}T00:00:00`).getTime() -
           new Date(`${state.periodStart}T00:00:00`).getTime()) / 86_400_000
        ) + 1)} días como máximo.
      </p>
    </>
  )
}

/* ================================================================
   STEP 1: Empresa
   ================================================================ */

export function StepEmpresa({
  state,
  onChange,
  onBack,
  onNext,
}: {
  state: WizardState
  onChange: (s: Partial<WizardState>) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nombre de la empresa</Label>
        <input
          className={inputStyle}
          placeholder="Ej. Constructora ABC"
          value={state.companyName}
          onChange={e => onChange({ companyName: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">NIT / CC</Label>
        <input
          className={inputStyle}
          placeholder="Ej. 900123456-7"
          value={state.companyNit}
          onChange={e => onChange({ companyNit: e.target.value })}
        />
      </div>
    </>
  )
}

/* ================================================================
   STEP 2: Seleccionar / Crear trabajadores
   ================================================================ */

export function StepTrabajadores({
  state,
  onChange,
  employees,
  onBack,
  onNext,
  onGoCreate,
}: {
  state: WizardState
  onChange: (s: Partial<WizardState>) => void
  employees: PayrollEmployeeRow[]
  onBack: () => void
  onNext: () => void
  onGoCreate: () => void
}) {
  const hasEmployees = employees.length > 0
  const selected = state.selectedEmployeeIds

  const toggleAll = () => {
    if (selected.length === employees.length) {
      onChange({ selectedEmployeeIds: [] })
    } else {
      onChange({ selectedEmployeeIds: employees.map(e => e.id) })
    }
  }

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange({ selectedEmployeeIds: selected.filter(s => s !== id) })
    } else {
      onChange({ selectedEmployeeIds: [...selected, id] })
    }
  }

  return (
    <>
      {hasEmployees ? (
        <>
          <button
            type="button"
            className="w-full text-left text-xs text-muted-foreground hover:text-foreground px-1 py-0.5"
            onClick={toggleAll}
          >
            {selected.length === employees.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          <div className="rounded-lg border border-border divide-y divide-border max-h-64 overflow-y-auto">
            {employees.map(emp => {
              const isSelected = selected.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => toggle(emp.id)}
                >
                  <div className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-foreground border-foreground' : 'border-border'
                  }`}>
                    {isSelected && <Check size={10} className="text-background" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{emp.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PAYMENT_TYPE_LABELS[emp.payment_type]} ·{' '}
                      {formatCurrency(
                        emp.payment_type === 'monthly' || emp.payment_type === 'biweekly'
                          ? emp.monthly_salary ?? 0
                          : emp.payment_type === 'weekly'
                            ? emp.weekly_rate ?? 0
                            : emp.payment_type === 'daily'
                              ? emp.daily_rate ?? 0
                              : emp.payment_type === 'hourly'
                                ? emp.hourly_rate ?? 0
                                : emp.task_rate ?? 0
                      )}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Aún no hay trabajadores registrados
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1"
        onClick={onGoCreate}
      >
        Crear trabajador nuevo
      </Button>
    </>
  )
}

/* ================================================================
   STEP 3a: Nombre del trabajador nuevo
   ================================================================ */

export function StepNombreTrabajador({
  newEmployee,
  onChange,
  onBack,
  onNext,
}: {
  newEmployee: NewEmployeeDraft
  onChange: (e: NewEmployeeDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nombre completo *</Label>
        <input
          className={inputStyle}
          placeholder="Ej. María Gómez"
          value={newEmployee.fullName}
          onChange={e => onChange({ ...newEmployee, fullName: e.target.value })}
        />
      </div>
    </>
  )
}

/* ================================================================
   STEP 3b: Documento y Cargo
   ================================================================ */

export function StepDocCargo({
  newEmployee,
  onChange,
  onBack,
  onNext,
}: {
  newEmployee: NewEmployeeDraft
  onChange: (e: NewEmployeeDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Documento (opcional)</Label>
        <input
          className={inputStyle}
          placeholder="CC 1.000.000.000"
          value={newEmployee.documentNumber}
          onChange={e => onChange({ ...newEmployee, documentNumber: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Cargo (opcional)</Label>
        <input
          className={inputStyle}
          placeholder="Ej. Oficial, auxiliar..."
          value={newEmployee.position}
          onChange={e => onChange({ ...newEmployee, position: e.target.value })}
        />
      </div>
    </>
  )
}

/* ================================================================
   STEP 3c: Tipo de pago
   ================================================================ */

export function StepTipoPago({
  newEmployee,
  onChange,
  onBack,
  onNext,
}: {
  newEmployee: NewEmployeeDraft
  onChange: (e: NewEmployeeDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  const rateField =
    newEmployee.paymentType === 'monthly' || newEmployee.paymentType === 'biweekly'
      ? 'monthlySalary'
      : newEmployee.paymentType === 'weekly'
        ? 'weeklyRate'
        : newEmployee.paymentType === 'daily'
          ? 'dailyRate'
          : newEmployee.paymentType === 'hourly'
            ? 'hourlyRate'
            : 'taskRate'

  const valid = num(newEmployee[rateField]) > 0

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Forma de pago *</Label>
        <select
          className={inputStyle}
          value={newEmployee.paymentType}
          onChange={e =>
            onChange({ ...newEmployee, paymentType: e.target.value as PayrollPaymentType })
          }
        >
          {(Object.keys(PAYMENT_TYPE_LABELS) as PayrollPaymentType[]).map(t => (
            <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {newEmployee.paymentType === 'monthly'
            ? 'Sueldo mensual (COP) *'
            : newEmployee.paymentType === 'biweekly'
              ? 'Sueldo por quincena (COP) *'
              : newEmployee.paymentType === 'weekly'
                ? 'Pago por semana (COP) *'
                : newEmployee.paymentType === 'daily'
                  ? 'Pago por día (COP) *'
                  : newEmployee.paymentType === 'hourly'
                    ? 'Pago por hora (COP) *'
                    : 'Valor obra / tarea (COP) *'}
        </Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder={
            newEmployee.paymentType === 'monthly'
              ? String(PAYROLL_CONSTANTS.SMLMV_2026)
              : newEmployee.paymentType === 'biweekly'
                ? 'Ej. 2300000'
                : '0'
          }
          value={newEmployee[rateField]}
          onChange={e => onChange({ ...newEmployee, [rateField]: e.target.value })}
        />
      </div>
    </>
  )
}

/* ================================================================
   STEP 3d: Configuración del trabajador
   ================================================================ */

export function StepConfigTrabajador({
  newEmployee,
  onChange,
  onBack,
  onNext,
}: {
  newEmployee: NewEmployeeDraft
  onChange: (e: NewEmployeeDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Configura las deducciones de seguridad social para este trabajador.
      </p>
      {[
        {
          key: 'transportAux' as const,
          label: 'Auxilio de transporte',
          desc: 'Aplica si el salario ≤ 2 SMLMV',
        },
        {
          key: 'deductHealth' as const,
          label: 'Descontar salud (4 %)',
          desc: 'Desmarca si ya tiene EPS por otra parte',
        },
        {
          key: 'deductPension' as const,
          label: 'Descontar pensión (4 %)',
          desc: 'Desmarca si ya tiene pensión por otra parte',
        },
      ].map(item => (
        <label
          key={item.key}
          className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-md hover:bg-muted/50"
        >
          <input
            type="checkbox"
            className="size-4 accent-[var(--foreground)] mt-0.5 shrink-0"
            checked={newEmployee[item.key]}
            onChange={e => onChange({ ...newEmployee, [item.key]: e.target.checked })}
          />
          <div>
            <span className="text-sm">{item.label}</span>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
        </label>
      ))}
    </div>
  )
}

/* ================================================================
   STEP 4: Días trabajados (liquidación)
   ================================================================ */

export function StepDiasTrabajados({
  workerLabel,
  liquidation,
  onChange,
  maxDays,
  onBack,
  onNext,
}: {
  workerLabel: string
  liquidation: LiquidationDraft
  onChange: (l: LiquidationDraft) => void
  maxDays: number
  onBack: () => void
  onNext: () => void
}) {
  const valid = num(liquidation.daysWorked) > 0 && num(liquidation.daysWorked) <= maxDays
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Trabajador: <span className="font-medium text-foreground">{workerLabel}</span>
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Días trabajados *</Label>
        <input
          className={inputStyle}
          type="number"
          min="1"
          max={maxDays}
          placeholder={`Máximo ${maxDays}`}
          value={liquidation.daysWorked}
          onChange={e => onChange({ ...liquidation, daysWorked: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">Periodo de {maxDays} días</p>
      </div>
    </>
  )
}

/* ================================================================
   STEP 4b: Día extra
   ================================================================ */

export function StepDiaExtra({
  workerLabel,
  liquidation,
  onChange,
  onBack,
  onNext,
}: {
  workerLabel: string
  liquidation: LiquidationDraft
  onChange: (l: LiquidationDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Trabajador: <span className="font-medium text-foreground">{workerLabel}</span>
      </p>
      <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-lg border border-border hover:bg-muted/50">
        <input
          type="checkbox"
          className="size-4 accent-[var(--foreground)] mt-0.5 shrink-0"
          checked={liquidation.extraDay}
          onChange={e => onChange({ ...liquidation, extraDay: e.target.checked })}
        />
        <div>
          <span className="text-sm font-medium">Agregar día extra</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se sumará 1 día adicional al total de días trabajados del trabajador.
          </p>
        </div>
      </label>
    </>
  )
}

/* ================================================================
   STEP 5: Festivos
   ================================================================ */

export function StepFestivos({
  workerLabel,
  liquidation,
  onChange,
  onBack,
  onNext,
}: {
  workerLabel: string
  liquidation: LiquidationDraft
  onChange: (l: LiquidationDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Trabajador: <span className="font-medium text-foreground">{workerLabel}</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Días festivos / dominicales</Label>
          <input
            className={inputStyle}
            type="number"
            min="0"
            placeholder="0"
            value={liquidation.holidayDaysWorked}
            onChange={e => onChange({ ...liquidation, holidayDaysWorked: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pago por día festivo (COP)</Label>
          <input
            className={inputStyle}
            type="number"
            min="0"
            placeholder={String(PAYROLL_CONSTANTS.PAGO_FESTIVO_DEFAULT)}
            value={liquidation.holidayDayRate}
            onChange={e => onChange({ ...liquidation, holidayDayRate: e.target.value })}
          />
        </div>
      </div>
    </>
  )
}

/* ================================================================
   STEP 6: Horas extra
   ================================================================ */

export function StepHorasExtra({
  workerLabel,
  liquidation,
  onChange,
  onBack,
  onNext,
}: {
  workerLabel: string
  liquidation: LiquidationDraft
  onChange: (l: LiquidationDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Trabajador: <span className="font-medium text-foreground">{workerLabel}</span>
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Extra diurna (horas)</Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder="0 h"
          value={liquidation.extraDayHours}
          onChange={e => onChange({ ...liquidation, extraDayHours: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">Se paga ×1,25</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Extra nocturna (horas)</Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder="0 h"
          value={liquidation.extraNightHours}
          onChange={e => onChange({ ...liquidation, extraNightHours: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">Se paga ×1,75</p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Recargo nocturno ordinario (horas)</Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder="0 h"
          value={liquidation.nightOvertimeHours}
          onChange={e => onChange({ ...liquidation, nightOvertimeHours: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">Se paga +35 %</p>
      </div>
    </>
  )
}

/* ================================================================
   STEP 7: Bonificaciones
   ================================================================ */

export function StepBonificaciones({
  workerLabel,
  liquidation,
  onChange,
  onBack,
  onNext,
}: {
  workerLabel: string
  liquidation: LiquidationDraft
  onChange: (l: LiquidationDraft) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Trabajador: <span className="font-medium text-foreground">{workerLabel}</span>
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Bonificaciones (COP)</Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder="0"
          value={liquidation.bonuses}
          onChange={e => onChange({ ...liquidation, bonuses: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Otras deducciones (COP)</Label>
        <input
          className={inputStyle}
          type="number"
          min="0"
          placeholder="0"
          value={liquidation.otherDeductions}
          onChange={e => onChange({ ...liquidation, otherDeductions: e.target.value })}
        />
      </div>
    </>
  )
}

/* ================================================================
   STEP 12: Resumen
   ================================================================ */

export function StepResumen({
  state,
  employees,
  onBack,
  onComplete,
  onDownloadPdf,
}: {
  state: WizardState
  employees: PayrollEmployeeRow[]
  onBack: () => void
  onComplete: () => void
  onDownloadPdf?: () => void
}) {
  const getWorkerLabel = (w: WorkerEntry): string => {
    if (w.existingId) {
      return employees.find(e => e.id === w.existingId)?.full_name ?? 'Trabajador'
    }
    return w.newEmployee?.fullName || 'Trabajador nuevo'
  }

  return (
    <>
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Periodo:</span>{' '}
          {state.periodStart} – {state.periodEnd}
        </p>
        {state.companyName && (
          <p>
            <span className="text-muted-foreground">Empresa:</span> {state.companyName}
            {state.companyNit && ` · ${state.companyNit}`}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Trabajadores ({state.workers.length}):
        </p>
        <div className="rounded-lg border border-border divide-y divide-border">
          {state.workers.map((w, i) => {
            const liq = w.liquidation
            const dias = num(liq.daysWorked)
            const totalDias = dias + (liq.extraDay ? 1 : 0)
            return (
              <div key={i} className="px-3 py-2">
                <p className="text-sm font-medium">{getWorkerLabel(w)}</p>
                <p className="text-xs text-muted-foreground">
                  {totalDias > 0 ? `${totalDias} días` : 'Sin días'}
                  {liq.extraDay && ` (+1 extra)`}
                  {num(liq.holidayDaysWorked) > 0 && ` + ${liq.holidayDaysWorked} fest.`}
                  {num(liq.extraDayHours) > 0 && ` + ${liq.extraDayHours} ext.d`}
                  {num(liq.extraNightHours) > 0 && ` + ${liq.extraNightHours} ext.n`}
                  {num(liq.bonuses) > 0 && ` + bonos`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onComplete} className="flex-1 gap-2">
          <Check size={14} />
          Generar nómina
        </Button>
        {onDownloadPdf && (
          <Button
            variant="outline"
            onClick={onDownloadPdf}
            className="gap-2"
          >
            <FileDown size={14} />
            PDF
          </Button>
        )}
      </div>
    </>
  )
}
