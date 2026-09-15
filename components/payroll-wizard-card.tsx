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
    <Card className="w-full max-w-lg mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {optional && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Opcional
              </span>
            )}
            <span className="text-xs text-muted-foreground tabular-nums">
              {step}/{totalSteps}
            </span>
          </div>
        </div>
        {/* Barra de progreso */}
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {children}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={!onBack}
          className="gap-1"
        >
          <ChevronLeft size={14} />
          Atrás
        </Button>
        {onNext && (
          <Button
            size="sm"
            onClick={onNext}
            disabled={nextDisabled}
            className="gap-1"
          >
            {nextLabel}
            <ChevronRight size={14} />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
