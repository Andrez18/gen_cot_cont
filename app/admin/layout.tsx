import type { Metadata } from 'next'

// Panel de administración: requiere sesión de admin, nunca debe
// indexarse en buscadores.
export const metadata: Metadata = {
  title: 'Administración',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
