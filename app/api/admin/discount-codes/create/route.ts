import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

const CODE_REGEX = /^[A-Z0-9-]{3,20}$/

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const code = String(body?.code ?? '').trim().toUpperCase()
  const type = body?.type === 'fixed' ? 'fixed' : 'percentage'
  const value = Number(body?.value)
  const maxUses = body?.maxUses ? Number(body.maxUses) : null
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt).toISOString() : null

  if (!CODE_REGEX.test(code)) {
    return NextResponse.json(
      { error: 'El código debe tener 3-20 letras/números (sin espacios)' },
      { status: 400 }
    )
  }

  if (!value || value <= 0 || (type === 'percentage' && value > 100)) {
    return NextResponse.json({ error: 'Valor de descuento inválido' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin.from('discount_codes').insert({
    code,
    type,
    value,
    max_uses: maxUses,
    expires_at: expiresAt,
    created_by: admin.email,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un código con ese nombre' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error al crear el código de descuento' }, { status: 500 })
  }

  logger.audit('Código de descuento creado', {
    path: '/api/admin/discount-codes/create',
    meta: { code, type, value, createdBy: admin.email },
  })

  return NextResponse.json({ success: true })
}
