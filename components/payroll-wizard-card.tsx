'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface WizardCardProps {
  title: string
  step: number
  totalSteps: number
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  optional?: boolean
  children: React.ReactNode
}

export function WizardCard({
  title,
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Siguiente',
  nextDisabled = false,
  optional = false,
  children,
}: WizardCardProps) {
  return (
    <Card
      key={step}
      className="w-full max-w-lg mx-auto animate-in fade-in-0 zoom-in-95 slide-in-from-right-6 duration-400 fill-mode-both"
    >
      {/* Header con animación escalonada */}
      <div
        className="px-6 pt-6 pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-75 fill-mode-both"
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {optional && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full animate-in fade-in zoom-in-50 duration-200 delay-200 fill-mode-both">
                Opcional
              </span>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {step}/{totalSteps}
            </span>
          </div>
        </div>
        {/* Barra de progreso con animación suave */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Contenido con animación escalonada */}
      <CardContent className="space-y-4 pt-5 animate-in fade-in slide-in-from-bottom-3 duration-300 delay-150 fill-mode-both">
        {children}
      </CardContent>

      {/* Footer con animación escalonada */}
      <CardFooter className="flex justify-between px-6 pb-6 pt-0 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200 fill-mode-both">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={!onBack}
          className="gap-1 transition-all duration-150 hover:gap-2 active:scale-95"
        >
          <ChevronLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
          Atrás
        </Button>
        {onNext && (
          <Button
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            className={`gap-1 transition-all duration-150 hover:gap-2 active:scale-95 ${
              !nextDisabled
                ? 'animate-in fade-in zoom-in-90 duration-200'
                : 'opacity-60'
            }`}
          >
            {nextLabel}
            <ChevronRight size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
