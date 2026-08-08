'use client'

import { useEffect, useState } from 'react'
import {
  FileText,
  Receipt,
  TrendingUp,
  History,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Smartphone,
  Check,
  PenLine,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { AuthForm } from '@/components/auth-form'

// Mismo precio que usa el paywall real (components/subscription-paywall.tsx),
// para que la landing nunca diga algo distinto a lo que se cobra dentro de la app.
const PRICE_COP = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000'

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#precio', label: 'Precio' },
  { href: '#preguntas', label: 'Preguntas' },
]

const CORE_FEATURES = [
  {
    icon: FileText,
    title: 'Cotizaciones detalladas',
    desc: 'Agrega multiples items con cantidad, unidad y precio unitario. El total, subtotal e impuestos se calculan solos.',
  },
  {
    icon: Receipt,
    title: 'Cuentas de cobro profesionales',
    desc: 'Con tus datos bancarios, certificacion tributaria y firma digital integrada. Listas para enviar al cliente.',
  },
  {
    icon: TrendingUp,
    title: 'Control de gastos e ingresos',
    desc: 'Registra cada movimiento con foto del recibo y genera informes en PDF cuando los necesites.',
  },
  {
    icon: History,
    title: 'Historial en la nube',
    desc: 'Todos tus documentos guardados y respaldados. Busca, visualiza y vuelve a descargar en segundos.',
  },
]

const DEFINING_TRAITS = [
  {
    icon: Sparkles,
    title: 'Simple',
    desc: 'Una interfaz clara que te permite generar un documento profesional en menos de 2 minutos.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro',
    desc: 'Tu informacion y la de tus clientes vive cifrada en la nube, con autenticacion y respaldo automatico.',
  },
  {
    icon: PenLine,
    title: 'A tu medida',
    desc: 'Firma digital, datos fiscales y plantillas que se adaptan a como trabajas vos, no al reves.',
  },
]

const FAQS = [
  {
    q: '¿CotiFactura es gratis?',
    a: 'No. Es una suscripción mensual de $30.000 COP que se paga por Nequi. Sin permanencia: pagás mes a mes y cancelás cuando quieras, sin contratos largos.',
  },
  {
    q: '¿Cómo pago la suscripción?',
    a: 'Transferís por Nequi y subís el comprobante junto con el número de referencia. Un admin confirma el pago y tu cuenta queda activa.',
  },
  {
    q: '¿Mis datos y los de mis clientes están seguros?',
    a: 'Si. Toda la informacion se almacena cifrada en la nube, con autenticacion por cuenta y control de acceso.',
  },
  {
    q: '¿Puedo usar CotiFactura desde el celular?',
    a: 'Si. Funciona en cualquier navegador y ademas se puede instalar como app en tu telefono para acceder con un toque.',
  },
  {
    q: '¿Necesito saber de contabilidad para usarla?',
    a: 'No. Vos cargas los items o el concepto y CotiFactura calcula totales, impuestos y genera el PDF listo para entregar.',
  },
]

export function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-dm-sans)] antialiased selection:bg-white selection:text-black">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex h-[68px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-white">
              <FileText className="h-4 w-4 text-black" strokeWidth={2.25} />
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">CotiFactura</span>
          </div>

          <nav className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13.5px] font-medium text-white/45 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <button
            onClick={() => setAuthOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-[9px] text-[13px] font-medium text-white/90 hover:bg-white/[0.09] hover:border-white/20 transition-all duration-200"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Glow radial suave detrás del titulo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 40% at 50% 15%, rgba(255,255,255,0.06), transparent 70%)',
            }}
          />
          {/* Grid pattern de fondo, muy sutil */}
          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '52px 52px',
              maskImage: 'radial-gradient(ellipse 55% 45% at 50% 0%, black 30%, transparent 100%)',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
            {/* Badge estilo pill, igual patron que "GRATIS · Reserva una demo" */}
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.04] pl-1.5 pr-5 py-1.5 text-[13px] text-white/65 mb-9 transition-all duration-700 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <span className="rounded-full border border-white/[0.14] bg-white/[0.07] text-white text-[11px] font-semibold px-2.5 py-[5px] tracking-[0.01em]">
                ${Number(PRICE_COP).toLocaleString('es-CO')} COP/mes
              </span>
              <span>Para contratistas independientes en Colombia</span>
              <ArrowRight className="h-3.5 w-3.5 text-white/40" />
            </div>

            <h1
              className={`text-[2.75rem] md:text-6xl lg:text-[4.25rem] font-bold tracking-[-0.03em] leading-[1.05] mb-7 text-white transition-all duration-700 ease-out delay-100 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              Cotizaciones y cobros
              <br />
              <span className="text-white/90">sin complicaciones</span>
            </h1>

            <p
              className={`text-[17px] md:text-lg text-white/45 max-w-lg mx-auto mb-11 leading-[1.6] transition-all duration-700 ease-out delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              Centraliza cotizaciones, cuentas de cobro, gastos y firma digital en un solo lugar.
              La plataforma pensada para independientes que quieren crecer sin complicarse.
            </p>

            <div
              className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 ease-out delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-black hover:bg-white/85 active:scale-[0.98] transition-all duration-200"
              >
                Crear cuenta
              </button>
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/[0.04] px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-white/[0.09] hover:border-white/20 active:scale-[0.98] transition-all duration-200"
              >
                Inicia sesión
              </button>
            </div>

            <div
              className={`flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mt-10 text-[12.5px] text-white/35 transition-all duration-700 ease-out delay-[400ms] ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/30" /> Sin permanencia
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/30" /> Cancela cuando quieras
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/30" /> Pago por Nequi
              </span>
            </div>
          </div>

          {/* Preview card, como el screenshot "flotando" de Melon Mind */}
          <div
            className={`relative max-w-4xl mx-auto px-6 pb-24 transition-all duration-[900ms] ease-out delay-500 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="rounded-[28px] border border-white/[0.08] bg-white text-black p-7 md:p-9 shadow-[0_0_100px_-25px_rgba(255,255,255,0.18)]">
              <div className="flex items-center gap-2.5 mb-7">
                <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-black">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-[14px] font-semibold tracking-[-0.01em]">CotiFactura</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3.5">
                {CORE_FEATURES.slice(0, 3).map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-2xl border border-black/[0.08] p-5 bg-black/[0.015] hover:bg-black/[0.03] transition-colors duration-200">
                    <Icon className="h-5 w-5 mb-3.5 text-black/60" strokeWidth={1.75} />
                    <p className="text-[14px] font-semibold mb-1.5 tracking-[-0.01em]">{title}</p>
                    <p className="text-[12.5px] text-black/45 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Lo que nos define */}
        <section className="border-t border-white/[0.08] py-24 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 md:gap-8">
            {DEFINING_TRAITS.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-5">
                  <Icon className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                </div>
                <h3 className="text-[17px] font-semibold mb-2.5 tracking-[-0.01em]">{title}</h3>
                <p className="text-[14.5px] text-white/45 leading-[1.65]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Caracteristicas detalladas */}
        <section id="caracteristicas" className="border-t border-white/[0.08] py-24 md:py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11.5px] font-semibold text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Características
            </p>
            <h2 className="text-[28px] md:text-4xl font-bold tracking-[-0.02em] mb-14">
              Todo lo que necesitas
            </h2>

            <div className="grid sm:grid-cols-2 gap-px rounded-[22px] overflow-hidden border border-white/[0.08] bg-white/[0.08]">
              {CORE_FEATURES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-black p-8 flex items-start gap-4.5 hover:bg-white/[0.02] transition-colors duration-200"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <Icon className="h-[18px] w-[18px] text-white/70" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-semibold mb-2 tracking-[-0.01em]">{title}</h3>
                    <p className="text-[14px] text-white/45 leading-[1.65]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multiplataforma */}
        <section id="por-que" className="border-t border-white/[0.08] py-24 md:py-28 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11.5px] font-semibold text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Multiplataforma
            </p>
            <h2 className="text-[28px] md:text-4xl font-bold tracking-[-0.02em] mb-4">
              En la palma de tu mano
            </h2>
            <p className="text-white/45 mb-14 max-w-md mx-auto leading-[1.65] text-[15px]">
              Accede desde el celular, la tablet o el computador. Instalala como app y generá
              documentos donde estés.
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'Rápido', desc: 'Un documento listo en menos de 2 minutos' },
                { icon: ShieldCheck, title: 'Seguro', desc: 'Datos cifrados y respaldados en la nube' },
                { icon: Smartphone, title: 'Móvil', desc: 'Instalable como app en tu celular' },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.045] transition-colors duration-200 p-6 text-left"
                >
                  <Icon className="h-5 w-5 text-white/60 mb-3.5" strokeWidth={1.75} />
                  <h3 className="text-[14.5px] font-semibold mb-1.5 tracking-[-0.01em]">{title}</h3>
                  <p className="text-[13px] text-white/40 leading-[1.6]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Precio */}
        <section id="precio" className="border-t border-white/[0.08] py-24 md:py-28 px-6">
          <div className="max-w-md mx-auto text-center">
            <p className="text-[11.5px] font-semibold text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Precio
            </p>
            <h2 className="text-[28px] md:text-4xl font-bold tracking-[-0.02em] mb-4">
              Un solo plan, sin letra chica
            </h2>
            <p className="text-white/45 mb-11 leading-[1.65] text-[15px]">
              Acceso completo a cotizaciones, cuentas de cobro, gastos e historial.
            </p>

            <div className="rounded-[24px] border border-white/[0.12] bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-8 text-left">
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-[40px] font-bold tracking-[-0.02em] leading-none">
                  ${Number(PRICE_COP).toLocaleString('es-CO')}
                </span>
                <span className="text-white/35 text-[14px]">COP / mes</span>
              </div>
              <p className="text-[12.5px] text-white/35 mb-7">Pago mensual por Nequi, sin permanencia</p>

              <ul className="space-y-3 mb-8">
                {[
                  'Cotizaciones y cuentas de cobro ilimitadas',
                  'Firma digital integrada',
                  'Control de gastos e ingresos',
                  'Historial y respaldo en la nube',
                  'Instalable como app en tu celular',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-white/65 leading-snug">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-white/70" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setAuthOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-semibold text-black hover:bg-white/85 active:scale-[0.98] transition-all duration-200"
              >
                Crear cuenta
              </button>
              <p className="text-[11.5px] text-white/30 text-center mt-3.5 leading-relaxed">
                El pago se confirma manualmente por Nequi luego de registrarte.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="border-t border-white/[0.08] py-24 md:py-28 px-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11.5px] font-semibold text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Preguntas frecuentes
            </p>
            <h2 className="text-[28px] md:text-4xl font-bold tracking-[-0.02em] mb-12">
              Resolvemos tus dudas
            </h2>
            <div className="flex flex-col divide-y divide-white/[0.08] border-t border-b border-white/[0.08]">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group py-[22px]">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[15px] font-medium tracking-[-0.005em] [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/[0.14] text-white/50 transition-transform duration-300 group-open:rotate-45 text-base leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-[14px] text-white/45 leading-[1.65] mt-3.5 pr-8">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-white/[0.08] py-24 md:py-32 px-6">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-[28px] md:text-4xl font-bold tracking-[-0.02em] mb-4">
              Empieza ahora
            </h2>
            <p className="text-white/45 mb-9 leading-[1.65] text-[15px]">
              ${Number(PRICE_COP).toLocaleString('es-CO')} COP al mes por Nequi, sin permanencia.
              Creá tu cuenta y generá tu primer documento hoy.
            </p>
            <button
              onClick={() => setAuthOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-semibold text-black hover:bg-white/85 active:scale-[0.98] transition-all duration-200"
            >
              Crear cuenta
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-9 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-white">
              <FileText className="h-3.5 w-3.5 text-black" strokeWidth={2.25} />
            </div>
            <span className="font-semibold text-[14px] tracking-[-0.01em]">CotiFactura</span>
          </div>
          <p className="text-[12.5px] text-white/35">Hecho para contratistas colombianos</p>
        </div>
      </footer>

      {/* Modal de autenticación */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-[440px] p-0 border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">
            Iniciar sesión o crear cuenta en CotiFactura
          </DialogTitle>
          <AuthForm variant="modal" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
