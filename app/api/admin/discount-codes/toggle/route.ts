import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, active } = await req.json().catch(() => ({}))
  if (!id || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { error } = await supabaseAdmin
    .from('discount_codes')
    .update({ active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Error al actualizar el código' }, { status: 500 })

  return NextResponse.json({ success: true })
}
