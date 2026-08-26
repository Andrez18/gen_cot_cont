import { createClient } from '@supabase/supabase-js'

/**
 * Modelo de administración:
 *  - ADMIN_EMAIL (env) es el admin "propietario": siempre es admin y no se
 *    puede quitar desde la app.
 *  - La tabla admin_roles guarda admins adicionales asignados desde el
 *    panel (solo accesible con service_role).
 */

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export function getRootAdminEmail(): string | null {
  return (
    process.env.ADMIN_EMAIL ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL
  )?.toLowerCase().trim() ?? null
}

export async function getExtraAdminEmails(): Promise<string[]> {
  const { data, error } = await db().from('admin_roles').select('email')
  if (error) return []
  return (data ?? []).map((r) => String(r.email).toLowerCase().trim())
}

/** Todos los correos con permisos de admin (propietario + extras). */
export async function getAdminEmails(): Promise<Set<string>> {
  const emails = new Set<string>()
  const root = getRootAdminEmail()
  if (root) emails.add(root)
  for (const email of await getExtraAdminEmails()) {
    if (email) emails.add(email)
  }
  return emails
}

/** Indica si un correo (ya normalizado o no) tiene permisos de admin. */
export async function isAdminEmail(email?: string | null): Promise<boolean> {
  const normalized = email?.toLowerCase().trim()
  if (!normalized) return false
  if (normalized === getRootAdminEmail()) return true
  const extras = await getExtraAdminEmails()
  return extras.includes(normalized)
}
