import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad de CotiFactura: cómo protegemos y usamos tus datos.',
  alternates: { canonical: '/politica-de-privacidad' },
}

export default function PoliticaPrivacidadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
