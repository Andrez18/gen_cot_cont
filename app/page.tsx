'use client'

import Link from 'next/link'
import { FileText, Receipt, History, ArrowRight, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { InstallPrompt } from '@/components/install-prompt'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="container px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-balance">
                Genera <span className="text-primary">Cotizaciones</span> y{' '}
                <span className="text-accent">Cuentas de Cobro</span> Profesionales
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Crea documentos comerciales de forma rápida, guárdalos y descárgalos en PDF. 
                Perfecto para contratistas y trabajadores independientes en Colombia.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/quotation/new">
                    <FileText className="h-5 w-5" />
                    Nueva Cotización
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href="/invoice/new">
                    <Receipt className="h-5 w-5" />
                    Nueva Cuenta de Cobro
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold sm:text-3xl">¿Qué puedes hacer?</h2>
              <p className="mt-2 text-muted-foreground">Todo lo que necesitas para gestionar tus documentos comerciales</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Cotizaciones</CardTitle>
                  <CardDescription>
                    Genera cotizaciones detalladas con múltiples items, cantidades y precios unitarios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="gap-2 p-0 h-auto">
                    <Link href="/quotation/new">
                      Crear cotización
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <Receipt className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Cuentas de Cobro</CardTitle>
                  <CardDescription>
                    Crea cuentas de cobro profesionales con datos bancarios y certificaciones tributarias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="gap-2 p-0 h-auto">
                    <Link href="/invoice/new">
                      Crear cuenta de cobro
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4 group-hover:bg-chart-3/20 transition-colors">
                    <History className="h-6 w-6 text-chart-3" />
                  </div>
                  <CardTitle className="text-xl">Historial</CardTitle>
                  <CardDescription>
                    Accede a todos tus documentos guardados, visualízalos y descárgalos cuando quieras
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="gap-2 p-0 h-auto">
                    <Link href="/history">
                      Ver historial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PWA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center mb-6">
                      <Smartphone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Instala la App</h3>
                    <p className="text-muted-foreground mb-6">
                      Agrega CotiFactura a tu pantalla de inicio y accede rápidamente desde tu celular, 
                      incluso sin conexión a internet.
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>✓ Funciona sin conexión</p>
                      <p>✓ Acceso rápido desde tu celular</p>
                      <p>✓ Tus datos siempre disponibles</p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 md:p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg">
                        <FileText className="h-10 w-10 text-primary-foreground" />
                      </div>
                      <p className="font-semibold">CotiFactura</p>
                      <p className="text-sm text-muted-foreground">Cotizaciones & Cobros</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">CotiFactura</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Diseñado para contratistas y trabajadores independientes en Colombia
            </p>
          </div>
        </div>
      </footer>

      <InstallPrompt />
    </div>
  )
}
