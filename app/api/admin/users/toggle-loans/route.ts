import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const userId = String(body?.userId ?? '').trim()
  const enabled = body?.enabled

  if (!userId || typeof enabled !== 'boolean') {
    return NextResponse.json(
      { error: 'Faltan parámetros (userId, enabled)' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('user_settings')
    .upsert({
      user_id: userId,
      can_use_loans: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json(
      { error: 'No se pudo actualizar el acceso a préstamos' },
      { status: 500 }
    )
  }

  logger.audit(enabled ? 'Acceso a préstamos habilitado' : 'Acceso a préstamos deshabilitado', {
    userId,
    path: '/api/admin/users/toggle-loans',
    meta: { changedBy: admin.email },
  })

  return NextResponse.json({ success: true, can_use_loans: enabled })
}
