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

export const metadata: Metadata = {
  title: 'CotiFactura - Cotizaciones y Cuentas de Cobro',
  description: 'Genera cotizaciones y cuentas de cobro profesionales de forma rápida y sencilla',
  generator: 'v0.app',
  manifest: '/manifest.json',
  keywords: ['cotización', 'cuenta de cobro', 'facturación', 'colombia', 'pdf'],
  authors: [{ name: 'Jorge Vallejo' }],
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
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
  return (
    <html lang="es" className={`${geist.variable} ${geistMono.variable} ${dmSans.variable} bg-background`} suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="description" content="Genera cotizaciones y cuentas de cobro profesionales de forma rápida y sencilla" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
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