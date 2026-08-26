import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

// Supabase Auth no tiene un ban permanente: se usa una duración muy larga
// (~100 años) para desactivar la cuenta y 'none' para reactivarla.
const BAN_DURATION = '876000h'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const userId = String(body?.userId ?? '').trim()
  const active = body?.active

  if (!userId || typeof active !== 'boolean') {
    return NextResponse.json(
      { error: 'Faltan parámetros (userId, active)' },
      { status: 400 }
    )
  }

  // Evita que el admin se bloquee a sí mismo por accidente.
  if (!active && userId === admin.id) {
    return NextResponse.json(
      { error: 'No puedes desactivar tu propia cuenta de admin' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: active ? 'none' : BAN_DURATION,
  })

  if (error || !data?.user) {
    return NextResponse.json(
      { error: 'No se pudo actualizar el estado del usuario' },
      { status: 500 }
    )
  }

  logger.audit(active ? 'Usuario activado por admin' : 'Usuario desactivado por admin', {
    userId,
    path: '/api/admin/users/toggle',
    meta: { changedBy: admin.email },
  })

  return NextResponse.json({
    success: true,
    banned_until: data.user.banned_until ?? null,
  })
}
