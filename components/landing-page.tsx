'use client'

import { useEffect, useState, useRef } from 'react'
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
  Mail,
  MessageSquare,
  Shield,
  Info,
  LogIn,
  UserPlus,
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AuthForm } from '@/components/auth-form'
const PRICE_COP = process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000'

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#precio', label: 'Precio' },
  { href: '#preguntas', label: 'Preguntas' },
]

const CORE_FEATURES = [
  {
    icon: FileText,
    label: 'Cotizaciones',
    title: 'Cotizaciones detalladas',
    desc: 'Agrega multiples items con cantidad, unidad y precio unitario. El total, subtotal e impuestos se calculan solos.',
  },
  {
    icon: Receipt,
    label: 'Cuentas de cobro',
    title: 'Cuentas de cobro profesionales',
    desc: 'Con tus datos bancarios, certificacion tributaria y firma digital integrada. Listas para enviar al cliente.',
  },
  {
    icon: TrendingUp,
    label: 'Gastos',
    title: 'Control de gastos e ingresos',
    desc: 'Registra cada movimiento con foto del recibo y genera informes en PDF cuando los necesites.',
  },
  {
    icon: History,
    label: 'Historial',
    title: 'Historial en la nube',
    desc: 'Todos tus documentos guardados y respaldados. Busca, visualiza y vuelve a descargar en segundos.',
  },
]

function FeatureMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-2xl">
      <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 bg-black/2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-black/15" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="h-5 w-40 rounded-md bg-black/5" />
        </div>
      </div>
      <div className="p-6 min-h-65 flex flex-col justify-center">{children}</div>
    </div>
  )
}


const FEATURE_PREVIEWS = [
  <div key="cotizaciones" className="space-y-3">
    <div className="flex items-center justify-between text-[11px] font-semibold text-black/35 uppercase tracking-wide px-1">
      <span>Item</span>
      <span>Total</span>
    </div>
    {[
      ['Instalación eléctrica', '$450.000'],
      ['Mano de obra (8h)', '$320.000'],
      ['Materiales', '$180.000'],
    ].map(([item, total]) => (
      <div
        key={item}
        className="flex items-center justify-between rounded-xl bg-black/3 px-4 py-3 text-[13px]"
      >
        <span className="text-black/70 font-medium">{item}</span>
        <span className="text-black/50">{total}</span>
      </div>
    ))}
    <div className="flex items-center justify-between px-4 pt-2 border-t border-black/5 text-[14px] font-semibold text-black/80">
      <span>Total</span>
      <span>$950.000</span>
    </div>
  </div>,

  // Cuentas de cobro profesionales
  <div key="cuentas-de-cobro" className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-black/35 font-semibold">
          Cuenta de cobro
        </p>
        <p className="text-[15px] font-semibold text-black/80">#0042</p>
      </div>
      <span className="text-[11px] font-medium text-white bg-black/80 rounded-full px-3 py-1">
        Pendiente
      </span>
    </div>
    <div className="rounded-xl bg-black/3 p-4 space-y-2 text-[13px] text-black/55">
      <div className="flex justify-between">
        <span>Cliente</span>
        <span className="text-black/80 font-medium">Constructora ABC</span>
      </div>
      <div className="flex justify-between">
        <span>Cuenta Nequi</span>
        <span className="text-black/80 font-medium">300 123 4567</span>
      </div>
      <div className="flex justify-between">
        <span>Valor</span>
        <span className="text-black/80 font-medium">$1.250.000</span>
      </div>
    </div>
    <div className="flex items-center gap-2 pt-1">
      <PenLine className="h-4 w-4 text-black/30" />
      <div className="h-8 flex-1 rounded-lg border border-dashed border-black/15" />
    </div>
  </div>,

  // Control de gastos e ingresos
  <div key="gastos" className="space-y-2.5">
    {[
      { name: 'Materiales ferretería', amount: '$85.000' },
      { name: 'Combustible', amount: '$40.000' },
      { name: 'Almuerzo equipo', amount: '$32.000' },
    ].map((g) => (
      <div key={g.name} className="flex items-center gap-3 rounded-xl bg-black/3 px-3 py-2.5">
        <div className="h-9 w-9 rounded-lg bg-black/10 flex items-center justify-center">
          <Receipt className="h-4 w-4 text-black/40" />
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium text-black/75">{g.name}</p>
        </div>
        <span className="text-[13px] text-black/50">{g.amount}</span>
      </div>
    ))}
  </div>,

  // Historial en la nube
  <div key="historial" className="grid grid-cols-3 gap-3">
    {['Cotización', 'Cuenta de cobro', 'Gasto', 'Cotización', 'Cuenta de cobro', 'Gasto'].map(
      (label, i) => (
        <div
          key={`${label}-${i}`}
          className="aspect-3/4 rounded-lg bg-black/3 border border-black/5 flex flex-col items-center justify-center gap-2"
        >
          <FileText className="h-5 w-5 text-black/25" />
          <span className="text-[10px] text-black/35 text-center px-1">{label}</span>
        </div>
      )
    )}
  </div>,
]

const DEFINING_TRAITS = [
  {
    icon: Sparkles,
    title: 'Simple',
    desc: 'Una interfaz clara que te permite generar un documento profesional en menos de 2 minutos y llevar tus cuentas claras.',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMobileMenuLinkClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div
      className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black"
      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
    >
      <header
        ref={headerRef}
        className={`site-header fixed top-0 left-0 right-0 z-50 px-4 py-4 ${
          isScrolled ? 'scrolled' : ''
        }`}
      >
        <div className="header-wrapper max-w-7xl mx-auto">
          <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10">
            <div className="header-content flex items-center justify-between h-14 px-6">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white text-xl z-50"
                aria-label="Toggle menu"
              >
                <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
              </button>

              <nav className="hidden md:flex items-center space-x-8">
                <a
                  href="#caracteristicas"
                  className="text-white/60 hover:text-white text-[16px] font-medium transition-colors"
                >
                  Características
                </a>
                <a
                  href="#precio"
                  className="text-white/60 hover:text-white text-[16px] font-medium transition-colors"
                >
                  Precios
                </a>
              </nav>

              <div className="absolute left-1/2 transform -translate-x-1/2">
                <a href="/" className="logo text-white text-lg font-semibold tracking-wide">
                  CotiFactura
                </a>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center space-x-2 bg-white text-gray-900 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[14px] sm:text-[16px] font-medium hover:bg-gray-100 hover:scale-105 duration-100 transition-all"
                >
                  <span className="hidden sm:inline">Iniciar ahora</span>
                  <span className="sm:hidden">Iniciar</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .site-header {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .site-header .header-wrapper {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            max-width: 80rem;
            margin: 0 auto;
          }

          .site-header .header-content {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .site-header nav a,
          .site-header .logo,
          .site-header button {
            transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .site-header.scrolled .header-wrapper {
            max-width: 60rem;
          }

          .site-header.scrolled {
            padding: 1.5rem 1.5rem !important;
          }

          @media (max-width: 768px) {
            .site-header .header-content {
              padding-left: 1rem;
              padding-right: 1rem;
            }

            .site-header.scrolled {
              padding: 1rem 1rem !important;
            }

            .site-header.scrolled .header-wrapper {
              max-width: 100%;
            }
          }
        `}</style>
      </header>

      <div
        className={`fixed inset-0 bg-black/95 backdrop-blur-lg z-40 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col items-center justify-center h-full space-y-8">
          <a
            href="#caracteristicas"
            onClick={handleMobileMenuLinkClick}
            className="mobile-menu-link text-white text-2xl font-medium hover:text-gray-300 transition-colors"
          >
            Características
          </a>
          <a
            href="#precio"
            onClick={handleMobileMenuLinkClick}
            className="mobile-menu-link text-white text-2xl font-medium hover:text-gray-300 transition-colors"
          >
            Precios
          </a>
        </nav>
      </div>

      <div className="h-18"></div>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 55% 40% at 50% 15%, rgba(255,255,255,0.06), transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.1] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '52px 52px',
              maskImage: 'radial-gradient(ellipse 55% 45% at 50% 0%, black 30%, transparent 100%)',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12 md:pt-20 md:pb-16 text-center">
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-white/4 pl-1.5 pr-5 py-1.5 text-[13px] text-white/65 mb-6 transition-all duration-700 ease-out ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <span className="rounded-full border border-white/[0.14] bg-white/[0.07] text-white text-[11px] font-semibold px-2.5 py-1.25 tracking-[0.01em]">
                ${Number(PRICE_COP).toLocaleString('es-CO')} COP/mes
              </span>
              <span>Para contratistas independientes en Colombia</span>
            </div>

            <h1
              className={`text-[2.75rem] md:text-6xl lg:text-[4.25rem] font-light tracking-[-0.03em] leading-[1.05] mb-5 text-white transition-all duration-700 ease-out delay-100 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              La app para contratistas independientes
              <br />
            </h1>

            <p
              className={`text-[17px] md:text-lg text-white/40 font-light max-w-lg mx-auto mb-8 leading-[1.2] transition-all duration-700 ease-out delay-200 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              Centraliza cotizaciones, cuentas de cobro y gastos.
              La plataforma pensada para contratistas independientes que quieren crecer y llevar un control sin complicarse.
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.14] bg-white/4 px-7 py-3.5 text-[14px] font-semibold text-white hover:bg-white/9 hover:border-white/20 active:scale-[0.98] transition-all duration-200"
              >
                Inicia sesión
              </button>
            </div>

            <div
              className={`flex flex-wrap items-center justify-center gap-x-7 gap-y-2 mt-7 text-[12.5px] text-white/35 transition-all duration-700 ease-out delay-[400ms] ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/20" /> Sin permanencia
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/20" /> Cancela cuando quieras
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-white/20" /> Pago por Nequi
              </span>
            </div>
          </div>
          <div className="relative max-w-5xl mx-auto px-6 mt-4">
            <div
              className="absolute inset-x-0 -top-6 h-[80%] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 60% at 50% 30%, rgba(255,255,255,0.08), transparent 70%)',
                filter: 'blur(40px)',
              }}
            />

            <div className="relative hidden md:block rounded-[28px] bg-white/20 p-2 md:p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
              <img
                src="/home.png"
                alt="imagen de inicio de CotiFactura"
                className="w-full h-auto rounded-4xl border border-white/5"
              />
            </div>

            <div className="relative block md:hidden rounded-3xl bg-white/20 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] max-w-66 mx-auto">
              <img
                src="/home-mobile.jpeg"
                alt="imagen de inicio de CotiFactura"
                className="w-full h-auto rounded-3xl border border-white/5"
              />
            </div>
          </div>
        </section>

        {/* Lo que nos define */}
        <section className="border-white/8 py-8 px-6 bg-white/8 mx-8 rounded-4xl">
            <h2 className="text-4xl my-4 pb-8 font-medium text-center">Acerca de nosotros...</h2>
          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 md:gap-7">
            {DEFINING_TRAITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group bg-black py-6 px-6 rounded-3xl">
                <div className='flex gap-2 text-center'>
                <Icon className="h-7 w-7 text-white/80" strokeWidth={1.75} />
                <h3 className="text-2xl font-normal mb-2.5 tracking-[-0.01em]">{title}</h3>
                </div>
                <p className="text-lg font-extralight text-white/45 leading-[1.65]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Caracteristicas detalladas */}
        <section id="caracteristicas" className="border-t border-white/8 py-16 md:py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[11.5px] font-light text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Características
            </p>
            <h2 className="text-[28px] md:text-4xl font-medium tracking-[-0.02em] mb-9">
              Todo lo que necesitas
            </h2>

            {/* Pill selector */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              {CORE_FEATURES.map(({ label }, index) => (
                <button
                  key={label}
                  onClick={() => setActiveFeature(index)}
                  className={`rounded-full px-5 py-2.5 text-[13.5px] font-medium transition-all duration-300 ${
                    activeFeature === index
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/55 border border-white/8 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            key={activeFeature}
            className="feature-panel max-w-5xl mx-auto rounded-[28px] border border-white/8 bg-white/3 overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0 items-center">
              <div className="relative p-6 md:p-8">
                <div
                  className="absolute inset-6 md:inset-8 -z-10 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(ellipse 70% 70% at 50% 60%, rgba(99,102,241,0.25), transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                <FeatureMockup>{FEATURE_PREVIEWS[activeFeature]}</FeatureMockup>
              </div>
              <div className="p-6 md:p-10 md:pl-4 text-left">
                <h3 className="text-2xl md:text-[32px] font-semibold tracking-[-0.02em] mb-3.5">
                  {CORE_FEATURES[activeFeature].title}
                </h3>
                <p className="text-white/50 text-[15px] leading-[1.7]">
                  {CORE_FEATURES[activeFeature].desc}
                </p>
              </div>
            </div>
          </div>

          <style jsx>{`
            .feature-panel {
              animation: featureFadeIn 0.45s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes featureFadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </section>

        {/* Multiplataforma */}
        <section id="por-que" className="border-t border-white/8 py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11.5px] font-light text-white/35 uppercase tracking-[0.14em] mb-2">
              Multiplataforma
            </p>
            <h2 className="text-3xl md:text-5xl font-medium tracking-[-0.02em] mb-4">
              En la palma de tu mano
            </h2>
            <p className="text-white/45 mb-10 max-w-md mx-auto leading-4 text-[15px] font-light">
              Accede desde el celular, la tablet o el computador. Instalala como pwa. Genera
              documentos donde estés y registra tus gastos detalladamente.
            </p>

            <img
              src="/multiplataforma.jpeg"
              alt="imagen de cotifactura multiplataforma"
              className="mx-auto block max-w-full h-auto"
            />
          </div>
        </section>

        {/* Precio */}
        <section id="precio" className="relative overflow-hidden py-8 md:py-20 px-6">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 45% 60% at 50% 40%, rgba(255,255,255,0.05), transparent 70%)',
            }}
          />
          <div className="relative max-w-md mx-auto text-center">
            <p className="text-xs font-light text-white/35 uppercase tracking-[0.14em] mb-3.5">
              Precio
            </p>
            <h2 className="text-3xl md:text-5xl font-medium tracking-[-0.02em] mb-4">
              Un solo plan, sin letra chica
            </h2>
            <p className="text-white/45 mb-8 leading-[1.65] text-[15px] font-extralight">
              Acceso completo a cotizaciones, cuentas de cobro, gastos e historial.
            </p>

            <div className="rounded-3xl border border-grey/5 bg-linear-to-b from-white/4.5 to-white/1.5 px-8 py-16 text-left">
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-[40px] font-semibold tracking-[-0.02em] leading-none">
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
        <section id="preguntas" className="py-8 md:py-20 px-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11.5px] font-light text-white/35 tracking-[0.14em] mb-1 justify-center text-center">
              Preguntas frecuentes
            </p>
            <h2 className="text-[28px] md:text-4xl font-medium tracking-[-0.02em] mb-9 justify-center text-center">
              Resolvemos tus dudas 
            </h2>
            <div className="flex flex-col divide-y divide-white/8 border-t border-b border-white/8">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-[15px] font-medium tracking-[-0.005em] [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full font-light text-white/50 transition-transform duration-300 group-open:rotate-180 text-base leading-none">
                      v
                    </span>
                  </summary>
                  <p className="text-[14px] text-white/45 leading-[1.65] mt-3.5 pr-8">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

{/* Footer */}
      <footer className="border-t border-white/8 py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 md:gap-6">
          {/* Marca + descripción */}
          <div>
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white">
                <FileText className="h-3.5 w-3.5 text-black" strokeWidth={2.25} />
              </div>
              <span className="font-semibold text-[15px] tracking-[-0.01em]">CotiFactura</span>
            </div>
            <p className="text-[13.5px] text-white/40 leading-[1.6] mb-4 max-w-60">
              La plataforma todo en uno para contratistas independientes en Colombia.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="text-[14px] font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:cotifactura@gmail.com"
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  cotifactura@gmail.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold mb-4">Acciones</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/politica-de-privacidad"
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  Política de privacidad
                </a>
              </li>
              <li>
                <a
                  href="/politica-de-uso-y-compra"
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  Política de Uso y Compra
                </a>
              </li>
              <li>
                <a
                  href="/aviso-legal"
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <Shield className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  Aviso legal
                </a>
              </li>
              <li>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <LogIn className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  Iniciar sesión
                </button>
              </li>
              <li>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-white/55 hover:text-white transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-white/35" strokeWidth={1.75} />
                  Crear cuenta
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/30">Hecho para contratistas colombianos</p>
          <p className="text-[12px] text-white/30">© {new Date().getFullYear()} CotiFactura</p>
        </div>
      </footer>

      {/* Modal de autenticación */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="max-w-[440px] p-0 border-none bg-transparent shadow-none">
          <DialogTitle className="sr-only">
            Iniciar sesión o crear cuenta en CotiFactura
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulario para iniciar sesión, registrarte o recuperar tu contraseña en CotiFactura
          </DialogDescription>
          <AuthForm variant="modal" />
        </DialogContent>
      </Dialog>
    </div>
  )
}