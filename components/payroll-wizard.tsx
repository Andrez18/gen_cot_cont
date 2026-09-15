'use client'

import { useCallback, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WizardCard } from '@/components/payroll-wizard-card'
import {
  StepPeriodo,
  StepEmpresa,
  StepTrabajadores,
  StepNombreTrabajador,
  StepDocCargo,
  StepTipoPago,
  StepConfigTrabajador,
  StepDiasTrabajados,
  StepDiaExtra,
  StepFestivos,
  StepHorasExtra,
  StepBonificaciones,
  StepResumen,
  type WizardState,
  type NewEmployeeDraft,
  type LiquidationDraft,
  type WorkerEntry,
  TOTAL_STEPS,
  initialWizardState,
  emptyNewEmployee,
  emptyLiquidation,
} from '@/components/payroll-wizard-steps'
import type { PayrollEmployeeRow } from '@/hooks/use-payroll'
import { PAYROLL_CONSTANTS } from '@/lib/payroll'

interface PayrollWizardProps {
  employees: PayrollEmployeeRow[]
  initialPeriodStart: string
  initialPeriodEnd: string
  onComplete: (data: {
    periodStart: string
    periodEnd: string
    companyName: string
    companyNit: string
    workers: WorkerEntry[]
  }) => void
  onDownloadPdf?: (data: {
    periodStart: string
    periodEnd: string
    companyName: string
    companyNit: string
    workers: WorkerEntry[]
  }) => void
  onCancel: () => void
}

const num = (v: string): number => {
  const n = parseFloat(v ?? '')
  return isFinite(n) && n > 0 ? n : 0
}

export function PayrollWizard({
  employees,
  initialPeriodStart,
  initialPeriodEnd,
  onComplete,
  onDownloadPdf,
  onCancel,
}: PayrollWizardProps) {
  const [state, setState] = useState<WizardState>(
    initialWizardState(initialPeriodStart, initialPeriodEnd),
  )

  // Trabajador actual usando el índice del estado (no se recalcula)
  const currentWorker = state.workers[state.liquidationIndex] ?? null

  const maxDays = useMemo(() => {
    const s = new Date(`${state.periodStart}T00:00:00`).getTime()
    const e = new Date(`${state.periodEnd}T00:00:00`).getTime()
    if (!isFinite(s) || !isFinite(e) || e < s) return 30
    return Math.min(30, Math.round((e - s) / 86_400_000) + 1)
  }, [state.periodStart, state.periodEnd])

  const update = useCallback((patch: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const goNext = useCallback(() => setState(prev => ({ ...prev, step: prev.step + 1 })), [])
  const goBack = useCallback(() => setState(prev => ({ ...prev, step: prev.step - 1 })), [])

  const getWorkerLabel = (w: WorkerEntry): string => {
    if (w.existingId) {
      return employees.find(e => e.id === w.existingId)?.full_name ?? 'Trabajador'
    }
    return w.newEmployee?.fullName || 'Trabajador nuevo'
  }

  /* ── Lógica de flujo ───────────────────────────────────────────── */

  const goCreate = () => {
    update({ isCreatingNew: true, newEmployee: emptyNewEmployee(), step: 3 })
  }

  // Desde step 2: agregar trabajadores seleccionados al array y ir a liquidación
  const goToLiquidation = () => {
    const newWorkers = [...state.workers]
    for (const id of state.selectedEmployeeIds) {
      if (!newWorkers.some(w => w.existingId === id)) {
        newWorkers.push({ existingId: id, liquidation: emptyLiquidation() })
      }
    }
    if (newWorkers.length === 0) return
    // Si ya había trabajadores, continuar desde donde quedó; si no, empezar en 0
    const startIdx = state.workers.length > 0 ? state.liquidationIndex : 0
    update({ workers: newWorkers, liquidationIndex: startIdx, step: 7 })
  }

  const finishCreateEmployee = () => {
    const newWorker: WorkerEntry = {
      newEmployee: state.newEmployee!,
      liquidation: emptyLiquidation(),
    }
    update({
      workers: [...state.workers, newWorker],
      newEmployee: null,
      isCreatingNew: false,
      liquidationIndex: state.workers.length,
      step: 7,
    })
  }

  const updateLiquidation = (l: LiquidationDraft) => {
    const idx = state.liquidationIndex
    if (idx < 0 || idx >= state.workers.length) return
    const workers = [...state.workers]
    workers[idx] = { ...workers[idx], liquidation: l }
    update({ workers })
  }

  // Avanzar al siguiente paso de liquidación (mismo trabajador, siguiente card)
  const nextLiquidationStep = () => goNext()

  // Terminar la liquidación del trabajador actual y avanzar a "¿Otro?"
  const finishWorkerLiquidation = () => {
    update({ liquidationIndex: state.liquidationIndex + 1 })
    goNext()
  }

  // Avanzar al siguiente trabajador para liquidar
  const goToNextWorker = () => {
    update({ liquidationIndex: state.liquidationIndex + 1, step: 7 })
  }

  const addAnotherWorker = () => {
    update({ step: 2, selectedEmployeeIds: [] })
  }

  const goToSummary = () => {
    update({ step: TOTAL_STEPS - 1 })
  }

  const buildWizardData = () => ({
    periodStart: state.periodStart,
    periodEnd: state.periodEnd,
    companyName: state.companyName,
    companyNit: state.companyNit,
    workers: state.workers,
  })

  const handleDownloadPdf = () => {
    if (onDownloadPdf) {
      onDownloadPdf(buildWizardData())
    }
  }

  /* ── Render del paso actual ─────────────────────────────────────── */

  const renderStep = () => {
    switch (state.step) {
      /* Step 0: Periodo */
      case 0:
        return (
          <WizardCard
            title="Periodo de liquidación"
            step={1}
            totalSteps={TOTAL_STEPS}
            onNext={goNext}
            nextDisabled={!state.periodStart || !state.periodEnd || state.periodEnd < state.periodStart}
          >
            <StepPeriodo state={state} onChange={update} onNext={goNext} />
          </WizardCard>
        )

      /* Step 1: Empresa */
      case 1:
        return (
          <WizardCard
            title="Datos de la empresa"
            step={2}
            totalSteps={TOTAL_STEPS}
            optional
            onBack={goBack}
            onNext={goNext}
            nextLabel="Continuar"
          >
            <StepEmpresa state={state} onChange={update} onBack={goBack} onNext={goNext} />
          </WizardCard>
        )

      /* Step 2: Seleccionar/Crear trabajadores */
      case 2:
        return (
          <WizardCard
            title="Trabajadores"
            step={3}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
            onNext={goToLiquidation}
            nextDisabled={state.selectedEmployeeIds.length === 0 && state.workers.length === 0}
            nextLabel={
              state.selectedEmployeeIds.length > 0
                ? `Continuar (${state.selectedEmployeeIds.length})`
                : state.workers.length > 0
                  ? `Continuar (${state.workers.length})`
                  : 'Continuar'
            }
          >
            <StepTrabajadores
              state={state}
              onChange={update}
              employees={employees}
              onBack={goBack}
              onNext={goToLiquidation}
              onGoCreate={goCreate}
            />
          </WizardCard>
        )

      /* Step 3a: Nombre */
      case 3:
        return (
          <WizardCard
            title="Nombre del trabajador"
            step={4}
            totalSteps={TOTAL_STEPS}
            onBack={() => update({ step: 2, isCreatingNew: false })}
            onNext={goNext}
            nextDisabled={!state.newEmployee?.fullName.trim()}
          >
            <StepNombreTrabajador
              newEmployee={state.newEmployee!}
              onChange={e => update({ newEmployee: e })}
              onBack={() => update({ step: 2 })}
              onNext={goNext}
            />
          </WizardCard>
        )

      /* Step 3b: Documento/Cargo */
      case 4:
        return (
          <WizardCard
            title="Documento y cargo"
            step={5}
            totalSteps={TOTAL_STEPS}
            optional
            onBack={goBack}
            onNext={goNext}
          >
            <StepDocCargo
              newEmployee={state.newEmployee!}
              onChange={e => update({ newEmployee: e })}
              onBack={goBack}
              onNext={goNext}
            />
          </WizardCard>
        )

      /* Step 3c: Tipo de pago */
      case 5: {
        const ne = state.newEmployee!
        const rateField =
          ne.paymentType === 'monthly' || ne.paymentType === 'biweekly'
            ? 'monthlySalary'
            : ne.paymentType === 'weekly'
              ? 'weeklyRate'
              : ne.paymentType === 'daily'
                ? 'dailyRate'
                : ne.paymentType === 'hourly'
                  ? 'hourlyRate'
                  : 'taskRate'
        return (
          <WizardCard
            title="Tipo de pago"
            step={6}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
            onNext={goNext}
            nextDisabled={num(ne[rateField]) <= 0}
          >
            <StepTipoPago
              newEmployee={state.newEmployee!}
              onChange={e => update({ newEmployee: e })}
              onBack={goBack}
              onNext={goNext}
            />
          </WizardCard>
        )
      }

      /* Step 3d: Configuración */
      case 6:
        return (
          <WizardCard
            title="Configuración del trabajador"
            step={7}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
            onNext={finishCreateEmployee}
            nextLabel="Crear trabajador"
          >
            <StepConfigTrabajador
              newEmployee={state.newEmployee!}
              onChange={e => update({ newEmployee: e })}
              onBack={goBack}
              onNext={finishCreateEmployee}
            />
          </WizardCard>
        )

      /* Step 7: Días trabajados */
      case 7: {
        if (!currentWorker) {
          update({ step: 12 })
          return null
        }
        return (
          <WizardCard
            title="Días trabajados"
            step={8}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
            onNext={nextLiquidationStep}
            nextDisabled={
              num(currentWorker.liquidation.daysWorked) <= 0 ||
              num(currentWorker.liquidation.daysWorked) > maxDays
            }
          >
            <StepDiasTrabajados
              workerLabel={getWorkerLabel(currentWorker)}
              liquidation={currentWorker.liquidation}
              onChange={updateLiquidation}
              maxDays={maxDays}
              onBack={goBack}
              onNext={nextLiquidationStep}
            />
          </WizardCard>
        )
      }

      /* Step 8: Día extra */
      case 8: {
        if (!currentWorker) {
          update({ step: 12 })
          return null
        }
      }

      /* Step 9: Festivos */
      case 9: {
        if (!currentWorker) {
          update({ step: 12 })
          return null
        }
        return (
          <WizardCard
            title="Días festivos"
            step={10}
            totalSteps={TOTAL_STEPS}
            optional
            onBack={goBack}
            onNext={nextLiquidationStep}
          >
            <StepFestivos
              workerLabel={getWorkerLabel(currentWorker)}
              liquidation={currentWorker.liquidation}
              onChange={updateLiquidation}
              onBack={goBack}
              onNext={nextLiquidationStep}
            />
          </WizardCard>
        )
      }

      /* Step 10: Horas extra */
      case 10: {
        if (!currentWorker) {
          update({ step: 12 })
          return null
        }
        return (
          <WizardCard
            title="Horas extra"
            step={11}
            totalSteps={TOTAL_STEPS}
            optional
            onBack={goBack}
            onNext={nextLiquidationStep}
          >
            <StepHorasExtra
              workerLabel={getWorkerLabel(currentWorker)}
              liquidation={currentWorker.liquidation}
              onChange={updateLiquidation}
              onBack={goBack}
              onNext={nextLiquidationStep}
            />
          </WizardCard>
        )
      }

      /* Step 11: Bonificaciones */
      case 11: {
        if (!currentWorker) {
          update({ step: 12 })
          return null
        }
        return (
          <WizardCard
            title="Bonificaciones y deducciones"
            step={12}
            totalSteps={TOTAL_STEPS}
            optional
            onBack={goBack}
            onNext={finishWorkerLiquidation}
            nextLabel="Siguiente trabajador"
          >
            <StepBonificaciones
              workerLabel={getWorkerLabel(currentWorker)}
              liquidation={currentWorker.liquidation}
              onChange={updateLiquidation}
              onBack={goBack}
              onNext={finishWorkerLiquidation}
            />
          </WizardCard>
        )
      }

      /* Step 12: ¿Otro trabajador? */
      case 12:
        return (
          <WizardCard
            title="¿Otro trabajador?"
            step={13}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
          >
            <p className="text-sm text-muted-foreground">
              Ya configuraste {state.workers.length} trabajador{state.workers.length !== 1 ? 'es' : ''}.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 transition-all duration-150 active:scale-[0.97]"
                onClick={addAnotherWorker}
              >
                Sí, agregar otro
              </Button>
              <Button
                className="flex-1 transition-all duration-150 active:scale-[0.97]"
                onClick={goToSummary}
              >
                Ver resumen
              </Button>
            </div>
          </WizardCard>
        )

      /* Step 13: Resumen */
      case 13:
        return (
          <WizardCard
            title="Resumen de la nómina"
            step={14}
            totalSteps={TOTAL_STEPS}
            onBack={goBack}
          >
            <StepResumen
              state={state}
              employees={employees}
              onBack={goBack}
              onComplete={() => onComplete(buildWizardData())}
              onDownloadPdf={onDownloadPdf ? handleDownloadPdf : undefined}
            />
          </WizardCard>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-8 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-8"
        onClick={onCancel}
        title="Cerrar asistente"
      >
        <X size={16} />
      </Button>
      {renderStep()}
    </div>
  )
}
