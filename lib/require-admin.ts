import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from './admin-roles'

/**
 * Valida el access token del request y confirma que el correo pertenece al
 * admin propietario (ADMIN_EMAIL) o a la tabla admin_roles. Devuelve el
 * usuario si es válido, o null si no lo es.
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

  if (!(await isAdminEmail(user.email))) return null

  return user
}
