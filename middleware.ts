import { NextRequest, NextResponse } from 'next/server'

// ─── Security Headers ────────────────────────────────────────────
function securityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload',
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://cdnjs.cloudflare.com",
      "frame-ancestors 'none'",
    ].join('; '),
  )
  return response
}

// ─── Middleware principal ─────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar assets estáticos y Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return securityHeaders(NextResponse.next())
  }

  // API routes: asegurar que solo acepten métodos válidos
  if (pathname.startsWith('/api/')) {
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    if (!allowedMethods.includes(request.method)) {
      return NextResponse.json({ error: 'Método no permitido' }, { status: 405 })
    }
  }

  const response = NextResponse.next()
  return securityHeaders(response)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
