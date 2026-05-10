'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FileText, Receipt, History, ArrowRight, Smartphone, TrendingUp, Shield, Zap, Sparkles, CheckCircle2 } from 'lucide-react'
import { Header } from '@/components/header'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px),
                                linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
          
          {/* Decorative Circles */}
          <div className="absolute -top-32 -right-32 size-[500px] rounded-full border border-border opacity-40 pointer-events-none" />
          <div className="absolute -top-16 -right-16 size-[300px] rounded-full border border-border opacity-30 pointer-events-none" />

          <div className="relative max-w-[720px] mx-auto px-6 py-20 md:py-28 text-center">
            {/* Badge */}
            <div 
              className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-border bg-secondary text-xs text-muted-foreground mb-7 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              <span className="size-1.5 rounded-full bg-chart-2 inline-block" />
              Para contratistas independientes en Colombia
            </div>

            {/* Main Heading */}
            <h1 
              className={`text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground leading-[1.1] mb-5 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <span className="text-balance">
                Cotizaciones y cobros{' '}
              </span>
              <span className="italic border-b-2 border-foreground pb-0.5">
                sin complicaciones
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              className={`text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              Genera documentos profesionales, controla tus gastos y descarga PDFs listos para entregar.
            </p>

            {/* CTA Buttons */}
            <div 
              className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <Link 
                href="/quotation/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                <FileText size={16} />
                Nueva cotizacion
              </Link>
              <Link 
                href="/invoice/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-secondary transition-colors"
              >
                <Receipt size={16} />
                Nueva cuenta de cobro
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border bg-background">
          <div className="max-w-[720px] mx-auto px-6">
            <div className="grid grid-cols-3 divide-x divide-border">
              {[
                { value: '100%', label: 'Gratis para usar' },
                { value: 'PDF', label: 'Descarga instantanea' },
                { value: '∞', label: 'Documentos sin limite' },
              ].map((stat) => (
                <div key={stat.label} className="py-7 px-4 text-center">
                  <div className="text-2xl md:text-3xl font-medium text-foreground mb-1">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-24 px-6 bg-muted">
          <div className="max-w-[720px] mx-auto">
            {/* Section Header */}
            <div className="mb-12">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Funcionalidades</p>
              <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                Todo en un solo lugar
              </h2>
            </div>

            {/* Feature Cards - Stacked List */}
            <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-border gap-px">
              {[
                { 
                  icon: FileText, 
                  title: 'Cotizaciones detalladas', 
                  desc: 'Agrega multiples items con cantidad, unidad y precio unitario. El total se calcula solo.', 
                  href: '/quotation/new', 
                  label: 'Crear cotizacion',
                },
                { 
                  icon: Receipt, 
                  title: 'Cuentas de cobro', 
                  desc: 'Con datos bancarios, certificacion tributaria y firma integrada. Listas para entregar.', 
                  href: '/invoice/new', 
                  label: 'Crear cuenta',
                },
                { 
                  icon: TrendingUp, 
                  title: 'Control de gastos', 
                  desc: 'Registra gastos e ingresos con fotos de recibos. Genera informes cuando quieras.', 
                  href: '/expenses/new', 
                  label: 'Ver gastos',
                },
                { 
                  icon: History, 
                  title: 'Historial completo', 
                  desc: 'Todos tus documentos guardados en la nube. Busca, visualiza y descarga en PDF.', 
                  href: '/history', 
                  label: 'Ver historial',
                },
              ].map(({ icon: Icon, title, desc, href, label }) => (
                <div
                  key={title}
                  className="flex items-start gap-5 p-7 bg-background"
                >
                  <div className="size-10 rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-foreground mb-1.5">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                    <Link 
                      href={href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:gap-2 transition-all"
                    >
                      {label} 
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-6 bg-muted">
          <div className="max-w-[720px] mx-auto">
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: Zap, title: 'Rapido', desc: 'Genera un documento en menos de 2 minutos' },
                { icon: Shield, title: 'Seguro', desc: 'Tus datos guardados en la nube con autenticacion' },
                { icon: Smartphone, title: 'Movil', desc: 'Instalable como app en tu celular' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 rounded-xl border border-border bg-background">
                  <Icon size={20} className="text-muted-foreground mb-3" />
                  <h3 className="text-sm font-medium text-foreground mb-1.5">{title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 md:py-24 px-6 border-t border-border bg-background">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight mb-4">
              Empieza ahora, es gratis
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed text-[15px]">
              Sin planes, sin tarjetas. Solo crea tu cuenta y empieza a generar documentos profesionales.
            </p>
            <Link 
              href="/quotation/new"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Crear primera cotizacion
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6 bg-background">
        <div className="max-w-[720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary flex items-center justify-center">
              <FileText size={14} className="text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground text-sm">CotiFactura</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hecho para contratistas colombianos
          </p>
        </div>
      </footer>
    </div>
  )
}
