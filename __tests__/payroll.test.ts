import { describe, it, expect } from 'vitest'
import {
  computeEmployeePayroll,
  computeRunTotals,
  formatPeriodLabel,
  generatePayrollNumber,
  fspRate,
  PAYROLL_CONSTANTS,
} from '@/lib/payroll'

const base = {
  transportAux: true,
  daysWorked: 30,
}

describe('computeEmployeePayroll — mensual', () => {
  it('liquida un SMLMV 2026 completo con auxilio y neto oficial ($1.859.928)', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'Trabajador',
      paymentType: 'monthly',
      monthlySalary: PAYROLL_CONSTANTS.SMLMV_2026,
    })
    expect(r.baseSalary).toBe(1_750_905)
    expect(r.auxAplica).toBe(true)
    expect(r.auxTransporte).toBe(249_095)
    expect(r.totalDevengados).toBe(2_000_000)
    // El auxilio de transporte no cotiza
    expect(r.ibc).toBe(1_750_905)
    expect(r.salud).toBe(70_036)
    expect(r.pension).toBe(70_036)
    expect(r.fsp).toBe(0)
    expect(r.totalDeducciones).toBe(140_072)
    expect(r.neto).toBe(1_859_928)
  })

  it('prorratea por días trabajados (quincena)', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: PAYROLL_CONSTANTS.SMLMV_2026,
      daysWorked: 15,
    })
    expect(r.baseSalary).toBe(875_453)
    expect(r.auxTransporte).toBe(124_548)
  })

  it('no paga auxilio de transporte por encima de 2 SMLMV', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 4_000_000,
    })
    expect(r.auxAplica).toBe(false)
    expect(r.auxTransporte).toBe(0)
  })
})

describe('computeEmployeePayroll — valor hora y recargos (Ley 2466)', () => {
  const salary = 2_100_000
  // 2.100.000 / 210 = $10.000 la hora ordinaria
  it('calcula el valor de la hora con divisor 210', () => {
    const r = computeEmployeePayroll({ ...base, fullName: 'T', paymentType: 'monthly', monthlySalary: salary })
    expect(r.hourValue).toBe(10_000)
  })

  it('aplica los multiplicadores de extras y recargo nocturno vigentes', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: salary,
      extraDayHours: 2,      // ×1,25 → $12.500/h → 25.000
      extraNightHours: 1,    // ×1,75 → $17.500/h
      nightOvertimeHours: 4, // +35 % → $3.500/h → 14.000
    })
    expect(r.extrasTotal).toBe(56_500)
    // El IBC incluye las horas extra (constituyen salario), sin auxilio
    expect(r.ibc).toBe(salary + r.extrasTotal)
  })
})

describe('días festivos pagados por día (tarifa editable)', () => {
  const salary = PAYROLL_CONSTANTS.SMLMV_2026

  it('usa $150.000 por día cuando no se define tarifa', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: salary,
      holidayDaysWorked: 2,
    })
    expect(r.holidayDays).toBe(2)
    expect(r.holidayRate).toBe(150_000)
    expect(r.holidayPay).toBe(300_000)
    expect(r.totalDevengados).toBe(2_300_000) // básico + auxilio + festivos
    // El pago de festivos constituye salario y cotiza al IBC
    expect(r.ibc).toBe(salary + 300_000)
  })

  it('respeta la tarifa editada por el usuario', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'daily',
      dailyRate: 70_000,
      daysWorked: 10,
      holidayDaysWorked: 3,
      holidayDayRate: 120_000,
    })
    expect(r.holidayPay).toBe(360_000)
  })

  it('sin días festivos no suma nada extra', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: salary,
    })
    expect(r.holidayDays).toBe(0)
    expect(r.holidayPay).toBe(0)
  })

  it('los festivos no alteran el auxilio de transporte pero sí cotizan', () => {
    const common = {
      ...base,
      fullName: 'T',
      paymentType: 'monthly' as const,
      monthlySalary: salary,
    }
    const sin = computeEmployeePayroll(common)
    const con = computeEmployeePayroll({ ...common, holidayDaysWorked: 1 })
    expect(con.auxTransporte).toBe(sin.auxTransporte)
    expect(con.totalDeducciones).toBeGreaterThan(sin.totalDeducciones)
  })
})

describe('computeEmployeePayroll — otras formas de pago', () => {
  it('por semana prorratea sobre una semana laboral de 6 días', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'weekly',
      weeklyRate: 210_000,
      daysWorked: 12, // 2 semanas completas
    })
    expect(r.baseSalary).toBe(420_000)
    // Mensualizado: 210.000 × (30/6) = 1.050.000 → sí aplica auxilio
    expect(r.monthlyEquivalent).toBe(1_050_000)
    expect(r.auxAplica).toBe(true)
    // Días parciales: 3 días = media semana
    const medio = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'weekly',
      weeklyRate: 210_000,
      daysWorked: 3,
    })
    expect(medio.baseSalary).toBe(105_000)
  })

  it('por día multiplica jornal por días', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'daily',
      dailyRate: 58_363.5,
      daysWorked: 15,
    })
    expect(r.baseSalary).toBe(875_453)
  })

  it('por hora usa las horas ordinarias como devengo base', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'hourly',
      hourlyRate: 10_000,
      hoursWorked: 100,
      daysWorked: 13,
    })
    expect(r.baseSalary).toBe(1_000_000)
    // Mensualizado: 10.000 × 210 → sí aplica auxilio proporcional a 13 días
    expect(r.auxAplica).toBe(true)
    expect(r.auxTransporte).toBe(Math.round((249_095 * 13) / 30))
  })

  it('por obra/tarea toma el monto pactado del periodo', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'per_task',
      taskRate: 1_000_000,
      daysWorked: 20,
    })
    expect(r.baseSalary).toBe(1_000_000)
    expect(r.monthlyEquivalent).toBe(Math.round((1_000_000 * 30) / 20))
  })
})

describe('Fondo de Solidaridad Pensional', () => {
  it('no aplica por debajo de 4 SMLMV', () => {
    expect(fspRate(3.99)).toBeNull()
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 7_000_000,
    })
    expect(r.fsp).toBe(0)
  })

  it('aplica 1 % desde 4 SMLMV', () => {
    expect(fspRate(4)).toBe(0.01)
    expect(fspRate(4.226)).toBe(0.01)
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 7_400_000, // ≈ 4,23 SMLMV
    })
    expect(r.fsp).toBe(74_000)
  })

  it('usa el aporte del 4 % sobre el excedente desde 20 SMLMV', () => {
    expect(fspRate(19.5)).toBe(0.04)
    expect(fspRate(25)).toBeNull()
    const ibc = 40_000_000
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: ibc,
    })
    expect(r.ibc).toBe(ibc) // bajo el tope de 25 SMLMV
    expect(r.fsp).toBe(Math.round((ibc - PAYROLL_CONSTANTS.SMLMV_2026 * 20) * 0.04))
  })

  it('techa el IBC en 25 SMLMV', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 60_000_000,
    })
    expect(r.ibc).toBe(PAYROLL_CONSTANTS.SMLMV_2026 * 25)
  })
})

describe('prestaciones sociales proporcionales', () => {
  it('provisiona cesantías, intereses, prima y vacaciones para un mes', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: PAYROLL_CONSTANTS.SMLMV_2026,
    })
    // Cesantías y prima sobre salario + auxilio; vacaciones solo básico
    expect(r.provisions.cesantias).toBe(166_667)
    expect(r.provisions.prima).toBe(166_667)
    expect(r.provisions.interesesCesantias).toBe(1_667)
    expect(r.provisions.vacaciones).toBe(72_954)
  })
})

describe('descuentos de seguridad social opcionales', () => {
  const salary = PAYROLL_CONSTANTS.SMLMV_2026

  it('sin salud ni pensión el neto es igual al devengado', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: salary,
      deductHealth: false,
      deductPension: false,
    })
    expect(r.deductHealth).toBe(false)
    expect(r.deductPension).toBe(false)
    expect(r.salud).toBe(0)
    expect(r.pension).toBe(0)
    expect(r.fsp).toBe(0)
    expect(r.totalDeducciones).toBe(0)
    expect(r.neto).toBe(r.totalDevengados)
  })

  it('sin pensión tampoco cobra FSP aunque el salario supere 4 SMLMV', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 7_400_000,
      deductPension: false,
    })
    expect(r.salud).toBe(Math.round((7_400_000) * 0.04))
    expect(r.pension).toBe(0)
    expect(r.fsp).toBe(0)
  })

  it('por defecto sí descuenta salud y pensión', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: salary,
    })
    expect(r.deductHealth).toBe(true)
    expect(r.deductPension).toBe(true)
    expect(r.totalDeducciones).toBe(140_072)
  })

  it('solo sin salud mantiene la pensión y su FSP si aplica', () => {
    const r = computeEmployeePayroll({
      ...base,
      fullName: 'T',
      paymentType: 'monthly',
      monthlySalary: 7_400_000,
      deductHealth: false,
    })
    expect(r.salud).toBe(0)
    expect(r.pension).toBe(296_000)
    expect(r.fsp).toBe(74_000)
  })
})

describe('totales de la nómina y utilidades', () => {
  it('suma devengados, deducciones y netos de todos los trabajadores', () => {
    const t = computeRunTotals([
      { neto: 100_000, totalDevengados: 120_000, totalDeducciones: 20_000, provisions: { total: 5_000 } },
      { neto: 50_000, totalDevengados: 60_000, totalDeducciones: 10_000, provisions: { total: 2_500 } },
    ] as never[])
    expect(t.employeeCount).toBe(2)
    expect(t.totalNeto).toBe(150_000)
    expect(t.totalDevengados).toBe(180_000)
    expect(t.totalProvisions).toBe(7_500)
  })

  it('formatea la etiqueta del periodo', () => {
    expect(formatPeriodLabel('2026-08-01', '2026-08-15')).toContain('agosto')
    expect(formatPeriodLabel('', '')).toBe('')
  })

  it('genera números consecutivos con prefijo NOM', () => {
    expect(generatePayrollNumber()).toMatch(/^NOM-\d{8}-\d{3}$/)
  })
})
