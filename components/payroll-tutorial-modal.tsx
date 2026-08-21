'use client'

import { useState } from 'react'
import {
  Users,
  CalendarRange,
  Clock,
  Calculator,
  FileDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

/** Clave en localStorage que recuerda si el usuario ya vio el tutorial. */
export const PAYROLL_TUTORIAL_KEY = 'cotifactura_payroll_tutorial_v1'

const STEPS = [
  {
    icon: Users,
    title: 'Registra tus trabajadores',
    description:
      'Agrega a cada persona con su nombre, documento y cómo se le paga: por mes, quincena, semana, día, hora o por obra/tarea.',
  },
  {
    icon: CalendarRange,
    title: 'Elige el periodo',
    description:
      'Define las fechas de la liquidación (puede ser una quincena, un mes o los días que necesites) e indica cuántos días trabajó cada quien.',
  },
  {
    icon: Clock,
    title: 'Horas extra y días festivos',
    description:
      'Registra horas extra diurnas/nocturnas y recargos nocturnos (Ley 2466 de 2025). Los días festivos se pagan por día completo: tú defines el valor de cada día (por defecto $150.000).',
  },
  {
    icon: Calculator,
    title: 'Cálculo automático colombiano',
    description:
      'La app aplica salario mínimo 2026 ($1.750.905), auxilio de transporte proporcional, salud y pensión (4 % c/u), fondo de solidaridad si aplica y estimado de prestaciones sociales.',
  },
  {
    icon: FileDown,
    title: 'Guarda y descarga el PDF',
    description:
      'Cada nómina queda guardada con su detalle por trabajador para que puedas descargarla en PDF o consultarla cuando quieras.',
  },
] as const

export function PayrollTutorialModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.icon

  const handleClose = (next: boolean) => {
    if (!next && typeof window !== 'undefined') {
      window.localStorage.setItem(PAYROLL_TUTORIAL_KEY, new Date().toISOString())
    }
    onOpenChange(next)
    if (!next) setStep(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            {step === 0 && <Sparkles className="h-4 w-4 text-primary" />}
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {STEPS.map((_, i) => (
            <button
              key={i}
              aria-label={`Paso ${i + 1}`}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === step ? 'w-5 bg-foreground' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          {!isLast ? (
            <>
              <Button variant="ghost" className="flex-1" onClick={() => handleClose(false)}>
                Saltar
              </Button>
              <Button className="flex-[2] gap-2" onClick={() => setStep(s => s + 1)}>
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button className="w-full gap-2" onClick={() => handleClose(false)}>
              <Sparkles className="h-4 w-4" />
              ¡Empezar a usar la nómina!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
