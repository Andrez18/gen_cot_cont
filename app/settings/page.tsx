import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { SettingsForm } from '@/components/settings-form'
import { SubscriptionSettings } from '@/components/subscription-settings'
import type { Metadata } from 'next'

// Página privada (requiere sesión): no debe indexarse en buscadores.
export const metadata: Metadata = {
  title: 'Configuración',
  robots: { index: false, follow: false },
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
        </Button>
        <div className="space-y-6">
          <SubscriptionSettings />
          <SettingsForm />
        </div>
      </main>
    </div>
  )
}