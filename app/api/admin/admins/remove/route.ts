import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { getRootAdminEmail } from '@/lib/admin-roles'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const email = String(body?.email ?? '').toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Falta el correo' }, { status: 400 })

  // El propietario (ADMIN_EMAIL) no vive en la tabla y no se puede quitar.
  if (email === getRootAdminEmail()) {
    return NextResponse.json(
      { error: 'El admin propietario no se puede quitar' },
      { status: 400 }
    )
  }

  // Evita que un admin se quite a sí mismo por accidente y pierda acceso
  // al panel sin querer (otro admin podría reasignarlo después).
  if (email === admin.email?.toLowerCase().trim()) {
    return NextResponse.json({ error: 'No puedes quitarte a ti mismo' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('admin_roles')
    .delete()
    .eq('email', email)
    .select('email')

  if (error) {
    return NextResponse.json({ error: 'No se pudo quitar el administrador' }, { status: 500 })
  }

  if (!data?.length) {
    return NextResponse.json({ error: 'Ese usuario no es administrador' }, { status: 404 })
  }

  logger.audit('Admin adicional removido', {
    path: '/api/admin/admins/remove',
    meta: { email, removedBy: admin.email },
  })

  return NextResponse.json({ success: true })
}
