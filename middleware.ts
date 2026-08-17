import { NextRequest, NextResponse } from 'next/server'

// ─── Rate Limiting (in-memory, por IP) ───────────────────────────
// Para producción con múltiples instancias, usar Redis. Esto funciona
// para una instancia única de Vercel.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpieza periódica para evitar memory leaks
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanupRateLimits() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt <= now) rateLimitMap.delete(key)
  }
}

function checkRateLimit(
  ip: string,
  path: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  cleanupRateLimits()

  const key = `${ip}:${path}`
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= maxRequests
}

// ─── Rate limit configs ──────────────────────────────────────────
const RATE_LIMITS: Array<{ pattern: RegExp; max: number; windowMs: number }> = [
  // API endpoints generales: 60 req/min
  { pattern: /^\/api\//, max: 60, windowMs: 60_000 },
  // Auth (login/register/reset): 10 req/min
  { pattern: /^\/auth\//, max: 10, windowMs: 60_000 },
  // Submit payment: 5 req/min
  { pattern: /^\/api\/payments\/submit/, max: 5, windowMs: 60_000 },
  // Admin: 30 req/min
  { pattern: /^\/api\/admin\//, max: 30, windowMs: 60_000 },
]

function getRateLimit(path: string) {
  for (const rl of RATE_LIMITS) {
    if (rl.pattern.test(path)) return rl
  }
  return null
}

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
  // CSP básico — se puede afinar si se agregan másCDNs/scripts
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "img-src 'self' blob: data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co",
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

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const rl = getRateLimit(pathname)
  if (rl && !checkRateLimit(ip, pathname, rl.max, rl.windowMs)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta más tarde.' },
      { status: 429 },
    )
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
    // Matchear todo excepto archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
