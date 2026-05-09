'use client'

import { FileText, Settings, Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useNotification } from '@/hooks/use_notification' 

interface HeaderProps {
  onSettingsClick?: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { success } = useNotification()

  const handleSignOut = async () => {
    await signOut()
    success('Sesión cerrada', user?.email ?? '')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">CotiFactura</span>
            <span className="text-xs text-muted-foreground leading-tight">Cotizaciones & Cobros</span>
          </div>
        </Link>

        {/* Nav desktop */}
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

          {/* Usuario + cerrar sesión — desktop */}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <span className="text-xs text-muted-foreground max-w-[120px] truncate">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </nav>

        {/* Nav mobile */}
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

              {/* Separador + cerrar sesión — mobile */}
              {user && (
                <>
                  <div className="border-t my-2" />
                  <div className="px-3 py-1">
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    className="justify-start text-destructive hover:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

      </div>
    </header>
  )
}