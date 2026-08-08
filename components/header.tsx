'use client'

import { useState } from 'react'
import {
  FileText,
  Settings,
  Menu,
  LogOut,
  Home,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  History,
  ChevronRight,
  Wrench,
  Sun,
  Moon,
  ShieldCheck,
  Tag,
  Download,
  Share,
  SquarePlus,
  Smartphone,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useNotification } from '@/hooks/use_notification'
import { useTheme } from 'next-themes'
import { usePwaInstall } from '@/hooks/use-pwa-install'

interface HeaderProps {
  onSettingsClick?: () => void
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim()

const ADMIN_LINKS = [
  { href: '/admin/payments',        label: 'Pagos pendientes',    icon: ShieldCheck },
  { href: '/admin/discount-codes',  label: 'Códigos de descuento', icon: Tag },
]

const NAV_LINKS = [
  { href: '/',               label: 'Inicio',             icon: Home },
  { href: '/quotation/new',  label: 'Nueva Cotización',   icon: FileSpreadsheet },
  { href: '/invoice/new',    label: 'Nueva Cuenta',       icon: Receipt },
  { href: '/expenses/new',   label: 'Gastos',             icon: TrendingUp },
  { href: '/tools',   label: 'Herramientas',             icon: TrendingUp },
  { href: '/history',        label: 'Historial',          icon: History },
  { href: '/settings',       label: 'Configuración',      icon: Settings },
]

export function Header({ onSettingsClick }: HeaderProps) {
  const { user, signOut } = useAuth()
  const { success } = useNotification()
  const { theme, setTheme } = useTheme()
  const { installed, isIOS, canInstall, hasNativePrompt, promptInstall } = usePwaInstall()
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL

  const handleSignOut = async () => {
    await signOut()
    success('Sesión cerrada', user?.email ?? '')
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const handleInstallClick = async () => {
    if (hasNativePrompt) {
      const outcome = await promptInstall()
      if (outcome === 'accepted') {
        success('¡Listo!', 'CotiFactura se está instalando')
      }
      return
    }
    // iOS u otros navegadores sin prompt nativo: mostramos instrucciones.
    setShowIOSInstructions(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">

        {/* Logo con gradiente */}
        <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-3 transition-transform duration-200 hover:scale-[1.02]">
          <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-primary transition-all duration-300 group-hover:shadow-blue-500/40 group-hover:scale-105">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-base sm:text-xl font-bold tracking-tight text-transparent">
              CotiFactura
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-muted-foreground/80 tracking-wide">
              Cotizaciones & Cobros
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Email visible en desktop con badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground max-w-[160px] truncate">
                {user.email}
              </span>
            </div>
          )}

          <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted hover:border-border transition-all duration-200"
              aria-label="Cambiar tema"
            >
              <Sun className="h-4 w-4 sm:h-5 sm:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 sm:h-5 sm:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted hover:border-border transition-all duration-200"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-80 sm:w-80 border-l border-border/50 bg-background/95 backdrop-blur-xl p-0 overflow-y-auto">
              {/* Header del menú */}
              <div className="p-6 border-b border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">CotiFactura</h2>
                    <p className="text-xs text-muted-foreground">Menú de navegación</p>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-1 p-4">
                {/* Links principales */}
                {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className="group justify-between h-12 px-4 rounded-xl hover:bg-emerald-500/10 hover:text-blue-600transition-all duration-200"
                    asChild
                  >
                    <Link href={href}>
                      <span className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-emerald-500/20 transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </Button>
                ))}

                {canInstall && (
                  <>
                    <div className="my-2 mx-2 border-t border-border/50" />
                    <Button
                      variant="ghost"
                      className="group justify-between h-12 px-4 rounded-xl hover:bg-emerald-500/10 hover:text-blue-600 transition-all duration-200"
                      onClick={handleInstallClick}
                    >
                      <span className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-emerald-500/20 transition-colors">
                          <Download className="h-4 w-4" />
                        </div>
                        <span className="font-medium">Descargar app</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
                    </Button>
                  </>
                )}

                {isAdmin && (
                  <>
                    <div className="my-2 mx-2 border-t border-border/50" />
                    {ADMIN_LINKS.map(({ href, label, icon: Icon }) => (
                      <Button
                        key={href}
                        variant="ghost"
                        className="group justify-between h-12 px-4 rounded-xl hover:bg-amber-500/10 transition-all duration-200"
                        asChild
                      >
                        <Link href={href}>
                          <span className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-amber-500/20 transition-colors">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{label}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </Button>
                    ))}
                  </>
                )}

                {onSettingsClick && (
                  <Button
                    variant="ghost"
                    className="group justify-between h-12 px-4 rounded-xl hover:bg-emerald-500/10 hover:text-blue-600 transition-all duration-200"
                    onClick={onSettingsClick}
                  >
                    <span className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-blue-500/20 transition-colors">
                        <Settings className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Configuración</span>
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" />
                  </Button>
                )}

                {/* Separador + usuario + cerrar sesión */}
                {user && (
                  <>
                    <div className="my-4 mx-2 border-t border-border/50" />
                    
                    {/* Card de usuario */}
                    <div className="mx-2 p-4 rounded-xl bg-muted/30 border border-border/50 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-600 text-white font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Conectado como</p>
                          <p className="text-sm font-semibold truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="justify-start gap-3 h-12 px-4 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all duration-200"
                      onClick={handleSignOut}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <span className="font-medium">Cerrar sesión</span>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      {/* Instrucciones para instalar en iOS / navegadores sin prompt nativo */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Download className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-center">Instalar CotiFactura</DialogTitle>
            <DialogDescription className="text-center">
              {isIOS
                ? 'Agrégala a tu pantalla de inicio para abrirla como una app.'
                : 'Sigue estos pasos desde el menú de tu navegador para instalarla.'}
            </DialogDescription>
          </DialogHeader>

          <ol className="flex flex-col gap-3 py-2">
            <li className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Share className="h-4 w-4" />
              </div>
              <span className="text-sm">
                {isIOS
                  ? 'Toca el botón Compartir en la barra de Safari'
                  : 'Abre el menú de opciones de tu navegador'}
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <SquarePlus className="h-4 w-4" />
              </div>
              <span className="text-sm">
                Selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                {!isIOS && ' o "Instalar aplicación"'}
              </span>
            </li>
            <li className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                {isIOS ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              </div>
              <span className="text-sm">Confirma y listo, tendrás CotiFactura como una app</span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </header>
  )
}