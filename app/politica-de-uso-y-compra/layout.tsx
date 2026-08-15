import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de uso y compra',
  description: 'Política de uso y compra de la suscripción de CotiFactura.',
  alternates: { canonical: '/politica-de-uso-y-compra' },
}

export default function PoliticaUsoCompraLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
