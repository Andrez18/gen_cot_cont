import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { getRootAdminEmail } from '@/lib/admin-roles'
import { logger } from '@/lib/logger'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').toLowerCase().trim()
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Ingresa un correo válido' }, { status: 400 })
  }

  if (email === getRootAdminEmail()) {
    return NextResponse.json({ error: 'Ese correo ya es el admin propietario' }, { status: 409 })
  }

  const supabaseAdmin = createAdminClient()

  // El usuario debe existir en auth: solo se promueven cuentas registradas.
  // Se recorren las páginas de listUsers buscando el correo.
  let targetUser: { id: string } | null = null
  const PER_PAGE = 500
  for (let page = 1; page <= 20; page++) {
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (!data?.users?.length) break
    const found = data.users.find((u) => u.email?.toLowerCase().trim() === email)
    if (found) {
      targetUser = { id: found.id }
      break
    }
    if (data.users.length < PER_PAGE) break
  }

  if (!targetUser) {
    return NextResponse.json(
      { error: 'No existe ninguna cuenta registrada con ese correo' },
      { status: 404 }
    )
  }

  const { error: insertError } = await supabaseAdmin.from('admin_roles').insert({
    user_id: targetUser.id,
    email,
    granted_by: admin.email,
  })

  if (insertError) {
    // Violación de unique → ya es admin
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'Ese usuario ya es administrador' }, { status: 409 })
    }
    return NextResponse.json({ error: 'No se pudo asignar el administrador' }, { status: 500 })
  }

  logger.audit('Admin adicional asignado', {
    userId: targetUser.id,
    path: '/api/admin/admins/add',
    meta: { email, grantedBy: admin.email },
  })

  return NextResponse.json({ success: true, email, user_id: targetUser.id })
}
