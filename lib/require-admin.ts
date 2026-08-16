import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Valida el access token del request y confirma que el correo coincide con
 * ADMIN_EMAIL. Devuelve el usuario si es válido, o null si no lo es.
 */
export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !user.email) return null

  // Se acepta ADMIN_EMAIL (server-only) o NEXT_PUBLIC_ADMIN_EMAIL como
  // respaldo, para no depender de tener las dos variables configuradas
  // en el mismo entorno (ej. Vercel).
  const adminEmail = (process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL)
    ?.toLowerCase().trim()
  if (!adminEmail || user.email.toLowerCase() !== adminEmail) return null

  return user
}
