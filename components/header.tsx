'use client'

import { FileText, Settings, Menu, LogOut, Home, FileSpreadsheet, Receipt, TrendingUp, History } from 'lucide-react'
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

const NAV_LINKS = [
  { href: '/',               label: 'Inicio',             icon: Home },
  { href: '/quotation/new',  label: 'Nueva Cotización',   icon: FileSpreadsheet },
  { href: '/invoice/new',    label: 'Nueva Cuenta',       icon: Receipt },
  { href: '/expenses/new',   label: 'Gastos',             icon: TrendingUp },
  { href: '/history',        label: 'Historial',          icon: History },
  { href: '/settings',       label: 'Configuración',      icon: Settings },
]

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

        {/* Menú hamburguesa — igual en mobile y desktop */}
        <div className="flex items-center gap-2">
          {/* Email visible en desktop */}
          {user && (
            <span className="hidden md:block text-xs text-muted-foreground max-w-[160px] truncate">
              {user.email}
            </span>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-1 mt-8">

                {/* Links principales */}
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className="justify-start gap-3"
                    asChild
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </Button>
                ))}

                {onSettingsClick && (
                  <Button
                    variant="ghost"
                    className="justify-start gap-3"
                    onClick={onSettingsClick}
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </Button>
                )}

                {/* Separador + usuario + cerrar sesión */}
                {user && (
                  <>
                    <div className="border-t my-3" />
                    <div className="px-3 py-1 mb-1">
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}