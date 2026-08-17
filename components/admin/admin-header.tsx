'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Tag,
  ArrowLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNotification } from '@/hooks/use_notification'

const TABS = [
  { href: '/admin', label: 'Resumen', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Usuarios', icon: Users, exact: false },
  { href: '/admin/payments', label: 'Pagos', icon: ShieldCheck, exact: false },
  { href: '/admin/discount-codes', label: 'Códigos', icon: Tag, exact: false },
]

export function AdminHeader() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { success } = useNotification()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    success('Sesión cerrada', user?.email ?? '')
  }

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="sticky top-0 z-50 px-4 pt-4">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link
                href="/"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 transition-colors hover:bg-white hover:text-black"
                aria-label="Volver a la app"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="hidden sm:flex min-w-0 items-center gap-2">
                <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
                  CotiFactura
                </span>
                <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/70">
                  Admin
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {TABS.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors ${
                      active
                        ? 'bg-white text-black'
                        : 'text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/70 hover:bg-white/10"
                aria-label="Abrir navegación"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <button
                onClick={handleSignOut}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/5 text-white/60 transition-colors hover:bg-red-500/15 hover:text-red-400"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mobileOpen && (
            <nav className="md:hidden flex flex-col gap-1 border-t border-white/8 p-3">
              {TABS.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'bg-white text-black' : 'text-white/60 hover:bg-white/8 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
              <button
                onClick={handleSignOut}
                className="mt-1 flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
