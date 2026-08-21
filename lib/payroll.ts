/* =========================================================
   MOTOR DE CÁLCULO DE NÓMINA — COLOMBIA 2026
   =========================================================

   Parámetros legales vigentes (verificados ago-2026):
   - SMLMV $1.750.905 (Decreto 0159 de 2026) y auxilio de
     transporte $249.095 (Decreto 1470 de 2025), este último
     solo para quienes ganen hasta 2 SMLMV ($3.501.810).
   - Jornada de 42 h semanales desde el 15-jul-2026 (Ley
     2101 de 2021 completada por Ley 2466 de 2025): el divisor
     para obtener el valor de la hora ordinaria es 210 h/mes.
   - Recargos (Ley 2466 de 2025 / arts. 158-168 CST):
       · Nocturno (7 p.m.–6 a.m.): +35 % dentro de la jornada.
       · Hora extra diurna: ×1,25 · extra nocturna: ×1,75.
       · Dominical/festivo: +90 % desde el 1-jul-2026
         (sube a 100 % desde jul-2027).
       · Extra diurna dom/fest: ×2,15 · extra nocturna dom/fest: ×2,65.
   - Aportes del trabajador: salud 4 % y pensión 4 % sobre el
     IBC (el auxilio de transporte NO es base de aportes).
   - Fondo de Solidaridad Pensional (FSP) desde 4 SMLMV según
     la escala del Decreto 1081 de 2015; desde 20 SMLMV se
     aporta el 4 % adicional solo sobre el excedente.

   Los valores son orientativos: esta herramienta no reemplaza
   la asesoría de un contador público.
   ========================================================= */

export type PayrollPaymentType =
  | 'monthly'   // sueldo mensual (prorrateado por días)
  | 'biweekly'  // quincenal: se ingresa el sueldo mensual y se liquida media quincena o los días trabajados
  | 'weekly'    // semanal: se ingresa el pago por semana (semana laboral de 6 días)
  | 'daily'     // jornal por día
  | 'hourly'    // tarifa por hora
  | 'per_task'  // obra, tarea o contrato por monto fijo

export const PAYMENT_TYPE_LABELS: Record<PayrollPaymentType, string> = {
  monthly: 'Por mes',
  biweekly: 'Quincenal',
  weekly: 'Semanal',
  daily: 'Por día',
  hourly: 'Por hora',
  per_task: 'Por obra / tarea',
}

/** Constantes legales vigentes en Colombia para 2026. */
export const PAYROLL_CONSTANTS = {
  /** Salario mínimo legal mensual vigente 2026 (Decreto 0159 de 2026). */
  SMLMV_2026: 1_750_905,
  /** Auxilio de transporte 2026 (Decreto 1470 de 2025). */
  AUX_TRANSPORTE_2026: 249_095,
  /** El auxilio de transporte aplica solo hasta 2 SMLMV. */
  TOPE_AUXILIO_SMLMV: 2,
  /** Divisor de horas/mes: jornada de 42 h semanales (desde 15-jul-2026). */
  HORAS_MES: 210,
  /** Convención legal de días por mes (CST). */
  DIAS_MES: 30,
  /** Semana laboral de referencia (lunes a sábado, CST). */
  DIAS_SEMANA_LABORAL: 6,
  /** Aporte del trabajador a salud (EPS). */
  SALUD_RATE: 0.04,
  /** Aporte del trabajador a pensión (AFP). */
  PENSION_RATE: 0.04,
  /** El IBC no puede superar 25 SMLMV. */
  TOPE_IBC_SMLMV: 25,
  /** Pago por día festivo/dominical trabajado (editable por el usuario). */
  PAGO_FESTIVO_DEFAULT: 150_000,
} as const

/** Multiplicadores vigentes para horas extra dentro de la app (Ley 2466 de 2025). */
export const RECARGOS_2026 = {
  /** Recargo nocturno ordinario: +35 %. */
  NOCTURNO: 0.35,
  /** Hora extra diurna: ×1,25. */
  EXTRA_DIURNA: 1.25,
  /** Hora extra nocturna: ×1,75. */
  EXTRA_NOCTURNA: 1.75,
} as const

/**
 * Escala del Fondo de Solidaridad Pensional sobre el IBC expresado en
 * SMLMV (Decreto 1081 de 2015). Devuelve la tasa aplicable o null si
 * el ingreso es menor a 4 SMLMV (no paga FSP).
 */
export function fspRate(smlmvRatio: number): number | null {
  if (smlmvRatio < 4) return null
  if (smlmvRatio >= 20) return null // desde 20 SMLMV el excedente aporta aparte
  const table: Array<[number, number]> = [
    [4, 0.01], [5, 0.012], [6, 0.014], [7, 0.016], [8, 0.018],
    [9, 0.02], [10, 0.022], [11, 0.024], [12, 0.026], [13, 0.028],
    [14, 0.03], [15, 0.032], [16, 0.034], [17, 0.036], [18, 0.038], [19, 0.04],
  ]
  let rate = table[0][1]
  for (const [min, r] of table) {
    if (smlmvRatio >= min) rate = r
  }
  return rate
}

function num(v: number | null | undefined): number {
  return typeof v === 'number' && isFinite(v) && v > 0 ? v : 0
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Redondea a pesos (COP no usa centavos en la práctica). */
function cop(v: number): number {
  return Math.round(v || 0)
}

/** Datos que el usuario digita para un trabajador dentro de un periodo. */
export interface PayrollLineInput {
  employeeId?: string
  fullName: string
  documentNumber?: string | null
  position?: string | null
  paymentType: PayrollPaymentType
  monthlySalary?: number | null
  weeklyRate?: number | null
  dailyRate?: number | null
  hourlyRate?: number | null
  taskRate?: number | null
  transportAux: boolean
  /** Días efectivamente trabajados en el periodo (afectan salario y auxilio). */
  daysWorked: number
  /** Horas ordinarias trabajadas (solo para pago por hora). */
  hoursWorked?: number
  /* Horas extra y recargos del periodo (por hora) */
  extraDayHours?: number
  extraNightHours?: number
  nightOvertimeHours?: number
  /** Días festivos/dominicales trabajados en el periodo (se pagan por día). */
  holidayDaysWorked?: number
  /** Pago acordado por cada día festivo; si se omite usa PAGO_FESTIVO_DEFAULT. */
  holidayDayRate?: number
  /** Bonificaciones / comisiones del periodo (se asumen salario). */
  bonuses?: number
  /** Otras deducciones acordadas (préstamos, libranzas, etc.). */
  otherDeductions?: number
  /**
   * Descuentos de seguridad social. Ambos activados por defecto;
   * se apagan cuando el trabajador ya tiene la cobertura por otra
   * parte (p. ej. independiente que cotiza solo, o pensionado).
   */
  deductHealth?: boolean
  deductPension?: boolean
}

export interface PayrollExtraLine {
  key: string
  concept: string
  hours: number
  /** Tarifa por hora aplicada (valor hora × multiplicador). */
  unitValue: number
  amount: number
}

export interface PayrollProvisions {
  cesantias: number
  interesesCesantias: number
  prima: number
  vacaciones: number
  total: number
}

export interface PayrollLineResult {
  baseSalary: number
  auxTransporte: number
  auxAplica: boolean
  extras: PayrollExtraLine[]
  extrasTotal: number
  /** Días festivos trabajados y su pago (tarifa editable). */
  holidayDays: number
  holidayRate: number
  holidayPay: number
  bonuses: number
  totalDevengados: number
  ibc: number
  salud: number
  pension: number
  fsp: number
  /** Indican si los descuentos están activos (para mostrar "no aplica"). */
  deductHealth: boolean
  deductPension: boolean
  otherDeductions: number
  totalDeducciones: number
  neto: number
  provisions: PayrollProvisions
  /** Salario mensualizado usado para topes y valor hora. */
  monthlyEquivalent: number
  hourValue: number
}

/**
 * Liquida un trabajador para el periodo según su forma de pago y las
 * horas/días registrados, aplicando la normativa colombiana vigente.
 */
export function computeEmployeePayroll(input: PayrollLineInput): PayrollLineResult {
  const C = PAYROLL_CONSTANTS
  const R = RECARGOS_2026
  const days = clamp(Math.floor(num(input.daysWorked)), 0, 31)
  const hoursOrdinarias = num(input.hoursWorked)

  /* ── 1. Salario básico devengado según la forma de pago ─────────────── */
  let baseSalary = 0
  switch (input.paymentType) {
    case 'monthly':
    case 'biweekly':
      // Ambos parten del sueldo mensual prorrateado por días trabajados;
      // una quincena equivale a 15 días de ese sueldo.
      baseSalary = (num(input.monthlySalary) * days) / C.DIAS_MES
      break
    case 'weekly':
      // Pago por semana, prorrateado sobre una semana laboral de 6 días:
      // 6 días trabajados = 1 semana completa.
      baseSalary = (num(input.weeklyRate) * days) / C.DIAS_SEMANA_LABORAL
      break
    case 'daily':
      baseSalary = num(input.dailyRate) * days
      break
    case 'hourly':
      baseSalary = num(input.hourlyRate) * hoursOrdinarias
      break
    case 'per_task':
      // Monto fijo pactado por la obra/tarea del periodo.
      baseSalary = num(input.taskRate)
      break
  }
  baseSalary = cop(baseSalary)

  /* ── 2. Salario mensualizado (para topes, auxilio y valor hora) ─────── */
  let monthlyEquivalent = 0
  switch (input.paymentType) {
    case 'monthly':
    case 'biweekly':
      monthlyEquivalent = num(input.monthlySalary)
      break
    case 'weekly':
      // ~5 semanas laborales por mes (30 días / 6).
      monthlyEquivalent = (num(input.weeklyRate) * C.DIAS_MES) / C.DIAS_SEMANA_LABORAL
      break
    case 'daily':
      monthlyEquivalent = num(input.dailyRate) * C.DIAS_MES
      break
    case 'hourly':
      monthlyEquivalent = num(input.hourlyRate) * C.HORAS_MES
      break
    case 'per_task':
      // Se normaliza el monto pactado como si fuera el salario del periodo.
      monthlyEquivalent = days > 0 ? (num(input.taskRate) * C.DIAS_MES) / days : 0
      break
  }

  /* ── 3. Auxilio de transporte (proporcional a días, tope 2 SMLMV) ───── */
  const auxAplica =
    !!input.transportAux &&
    monthlyEquivalent > 0 &&
    monthlyEquivalent <= PAYROLL_CONSTANTS.SMLMV_2026 * PAYROLL_CONSTANTS.TOPE_AUXILIO_SMLMV
  const auxTransporte = auxAplica ? cop((C.AUX_TRANSPORTE_2026 * days) / C.DIAS_MES) : 0

  /* ── 4. Horas extra y recargos ──────────────────────────────────────── */
  const hourValue =
    input.paymentType === 'hourly'
      ? num(input.hourlyRate)
      : monthlyEquivalent > 0
        ? monthlyEquivalent / C.HORAS_MES
        : 0

  const extrasSpec: Array<[string, string, number]> = [
    ['extraDay', 'Horas extra diurnas (×1,25)', R.EXTRA_DIURNA],
    ['extraNight', 'Horas extra nocturnas (×1,75)', R.EXTRA_NOCTURNA],
    ['nightRec', 'Recargo nocturno ordinario (+35 %)', R.NOCTURNO],
  ]
  const extrasInput: Record<string, number> = {
    extraDay: num(input.extraDayHours),
    extraNight: num(input.extraNightHours),
    nightRec: num(input.nightOvertimeHours),
  }

  const extras: PayrollExtraLine[] = []
  let extrasTotal = 0
  if (hourValue > 0) {
    for (const [key, concept, factor] of extrasSpec) {
      const h = extrasInput[key]
      if (!h) continue
      const unitValue = cop(hourValue * factor)
      const amount = cop(unitValue * h)
      extras.push({ key, concept, hours: h, unitValue, amount })
      extrasTotal += amount
    }
  }

  /* ── Días festivos/dominicales: se pagan por día con tarifa editable ── */
  const holidayDays = clamp(Math.floor(num(input.holidayDaysWorked)), 0, 31)
  const holidayRate =
    input.holidayDayRate == null || input.holidayDayRate < 0
      ? C.PAGO_FESTIVO_DEFAULT
      : input.holidayDayRate
  const holidayPay = cop(holidayDays * holidayRate)

  const bonuses = cop(num(input.bonuses))
  const totalDevengados = cop(
    baseSalary + auxTransporte + extrasTotal + holidayPay + bonuses,
  )

  /* ── 5. Deducciones de seguridad social ─────────────────────────────── */
  // IBC: todo lo salarial (básico + extras + festivos + bonos). El auxilio
  // de transporte no cotiza. Techo legal: 25 SMLMV.
  const topeIbc = C.SMLMV_2026 * C.TOPE_IBC_SMLMV
  const ibc = Math.min(cop(baseSalary + extrasTotal + holidayPay + bonuses), topeIbc)

  // Los descuentos se pueden omitir por trabajador cuando ya tiene la
  // seguridad social cubierta por otra parte.
  const deductHealth = input.deductHealth !== false
  const deductPension = input.deductPension !== false

  const salud = deductHealth ? cop(ibc * C.SALUD_RATE) : 0
  const pension = deductPension ? cop(ibc * C.PENSION_RATE) : 0

  // Fondo de Solidaridad Pensional según escala, o aporte del 4 %
  // sobre el excedente cuando supera 20 SMLMV. Sin pensión no procede:
  // el FSP hace parte del sistema pensional.
  const ratio = ibc / C.SMLMV_2026
  const fspScale = deductPension ? fspRate(ratio) : null
  const fsp = !deductPension
    ? 0
    : fspScale != null
      ? cop(ibc * fspScale)
      : ratio >= 20
        ? cop((ibc - C.SMLMV_2026 * 20) * 0.04)
        : 0

  const otherDeductions = cop(num(input.otherDeductions))
  const totalDeducciones = cop(salud + pension + fsp + otherDeductions)

  const neto = cop(totalDevengados - totalDeducciones)

  /* ── 6. Prestaciones sociales proporcionales (informativo) ──────────── */
  // Cesantías, intereses y prima se liquidan sobre el salario mensual
  // incluido el auxilio de transporte; vacaciones solo sobre el básico.
  const mesConAux = monthlyEquivalent + (auxAplica ? C.AUX_TRANSPORTE_2026 : 0)
  const cesantias = cop((mesConAux * days) / 360)
  const interesesCesantias = cop(((mesConAux * days) / 360) * 0.12 * (days / 360))
  const prima = cop((mesConAux * days) / 360)
  const vacaciones = cop((monthlyEquivalent * days) / 720)
  const provisions: PayrollProvisions = {
    cesantias,
    interesesCesantias,
    prima,
    vacaciones,
    total: cop(cesantias + interesesCesantias + prima + vacaciones),
  }

  return {
    baseSalary,
    auxTransporte,
    auxAplica,
    extras,
    extrasTotal: cop(extrasTotal),
    holidayDays,
    holidayRate: Math.round(holidayRate),
    holidayPay,
    bonuses,
    totalDevengados,
    ibc,
    salud,
    pension,
    fsp,
    deductHealth,
    deductPension,
    otherDeductions,
    totalDeducciones,
    neto,
    provisions,
    monthlyEquivalent: cop(monthlyEquivalent),
    hourValue: Math.round(hourValue * 100) / 100,
  }
}

export interface PayrollRunTotals {
  employeeCount: number
  totalDevengados: number
  totalDeducciones: number
  totalNeto: number
  totalProvisions: number
}

/** Totales de una nómina completa (suma de todos los trabajadores). */
export function computeRunTotals(results: PayrollLineResult[]): PayrollRunTotals {
  return {
    employeeCount: results.length,
    totalDevengados: results.reduce((s, r) => s + r.totalDevengados, 0),
    totalDeducciones: results.reduce((s, r) => s + r.totalDeducciones, 0),
    totalNeto: results.reduce((s, r) => s + r.neto, 0),
    totalProvisions: results.reduce((s, r) => s + r.provisions.total, 0),
  }
}

/** Etiqueta amigable del periodo, ej: "1 – 15 de agosto de 2026". */
export function formatPeriodLabel(start: string, end: string): string {
  if (!start || !end) return ''
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return ''
  const fmtDayMonth = (d: Date) =>
    d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  return sameMonth
    ? `${fmtDayMonth(s)} – ${e.getDate()} de ${e.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`
    : `${fmtDayMonth(s)} – ${fmtDayMonth(e)} ${e.getFullYear()}`
}

/** Número consecutivo para la liquidación, ej: NOM-20260821-482. */
export function generatePayrollNumber(): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `NOM-${date}-${random}`
}
