import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Valida el access token del request contra Supabase Auth y devuelve el
 * usuario autenticado, o null si el token falta, es inválido o expiró.
 * A diferencia de requireAdmin, esto no exige ningún correo en particular:
 * lo usan las rutas de pago que debe poder llamar cualquier usuario logueado.
 */
export async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !user.email) return null

  return user
}
