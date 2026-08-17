import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/admin-header'

// Panel de administración: requiere sesión de admin, nunca debe
// indexarse en buscadores. Visualmente es deliberadamente distinto de la
// app de usuario (que usa el theme claro/oscuro toggleable): siempre usa
// la identidad negra de la landing, sin importar el theme elegido por el
// usuario en el resto de la app.
export const metadata: Metadata = {
  title: 'Administración',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
      {/* Glow + grid de fondo, igual a la sección hero de la landing */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 55% 40% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)',
        }}
      />

      <div className="relative">
        <AdminHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      </div>
    </div>
  )
}
