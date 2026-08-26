import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { getRootAdminEmail } from '@/lib/admin-roles'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin
    .from('admin_roles')
    .select('user_id, email, granted_by, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Error al obtener administradores' }, { status: 500 })
  }

  return NextResponse.json({
    root_email: getRootAdminEmail(),
    admins: data ?? [],
  })
}
