import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aviso legal',
  description: 'Aviso legal de CotiFactura.',
  alternates: { canonical: '/aviso-legal' },
}

export default function AvisoLegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
