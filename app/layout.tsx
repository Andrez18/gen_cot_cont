import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NotificationProvider } from '@/hooks/use_notification'
import { AuthGuard } from '@/components/auth-guard'
import { SubscriptionGuard } from '@/components/subscription-guard'
import { ThemeProvider } from '@/components/theme-provider'
import { SwRegister } from '@/components/sw-register'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotifactura.vercel.app'
const SITE_NAME = 'CotiFactura'
const SITE_DESCRIPTION =
  'CotiFactura es la app para contratistas independientes en Colombia: genera cotizaciones, cuentas de cobro y controla tus gastos e ingresos, con firma digital y respaldo en la nube.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CotiFactura - Cotizaciones y Cuentas de Cobro para Contratistas',
    template: '%s | CotiFactura',
  },
  description: SITE_DESCRIPTION,
  generator: 'v0.app',
  applicationName: SITE_NAME,
  manifest: '/manifest.json',
  keywords: [
    'CotiFactura',
    'cotizaciones',
    'cuentas de cobro',
    'facturación para contratistas',
    'contratistas independientes Colombia',
    'generador de cotizaciones',
    'cuenta de cobro PDF',
    'control de gastos e ingresos',
    'firma digital PDF',
    'app para freelancers Colombia',
  ],
  authors: [{ name: 'Jorge Vallejo' }],
  creator: 'CotiFactura',
  publisher: 'CotiFactura',
  category: 'business',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: 'CotiFactura - Cotizaciones y Cuentas de Cobro para Contratistas',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CotiFactura - Cotizaciones y cuentas de cobro para contratistas independientes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CotiFactura - Cotizaciones y Cuentas de Cobro para Contratistas',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.jpg', sizes: '512x512', type: 'image/jpeg' },
    ],
    apple: '/apple-icon.jpg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CotiFactura',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b5998' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'CotiFactura',
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000',
          priceCurrency: 'COP',
          priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        },
        inLanguage: 'es-CO',
        image: `${SITE_URL}/og-image.png`,
      },
      {
        '@type': 'Organization',
        name: 'CotiFactura',
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512x512.jpg`,
        email: 'hola@cotifactura.app',
      },
      {
        '@type': 'WebSite',
        name: 'CotiFactura',
        url: SITE_URL,
        inLanguage: 'es-CO',
      },
    ],
  }

  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${dmSans.variable} bg-background`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="icon" href="/icon-192x192.png" type="image/png" />
        <link rel="icon" href="/icon-512x512.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/apple-icon.jpg" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SwRegister />
          <NotificationProvider>
            <AuthGuard>
              <SubscriptionGuard>
                {children}
              </SubscriptionGuard>
              {process.env.NODE_ENV === 'production' && <Analytics />}
            </AuthGuard>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}