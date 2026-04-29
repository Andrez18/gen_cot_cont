'use client'

import { FileText, Settings, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import Link from 'next/link'

interface HeaderProps {
  onSettingsClick?: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">CotiFactura</span>
            <span className="text-xs text-muted-foreground leading-tight">Cotizaciones & Cobros</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" asChild>
            <Link href="/">Inicio</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/quotation/new">Nueva Cotización</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/invoice/new">Nueva Cuenta</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/expenses/new">Gastos</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/history">Historial</Link>
          </Button>
          {onSettingsClick && (
            <Button variant="ghost" size="icon" onClick={onSettingsClick}>
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </nav>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-2 mt-8">
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/">Inicio</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/quotation/new">Nueva Cotización</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/invoice/new">Nueva Cuenta de Cobro</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/expenses/new">Gastos</Link>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <Link href="/history">Historial</Link>
              </Button>
              {onSettingsClick && (
                <Button variant="ghost" className="justify-start" onClick={onSettingsClick}>
                  <Settings className="h-5 w-5 mr-2" />
                  Configuración
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
