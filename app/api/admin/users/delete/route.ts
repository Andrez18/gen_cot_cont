import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const userId = String(body?.userId ?? '').trim()
  if (!userId) return NextResponse.json({ error: 'Falta userId' }, { status: 400 })

  // No te puedes eliminar a ti mismo desde el panel, para evitar quedar
  // sin acceso de admin por accidente.
  if (userId === admin.id) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta de admin' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Borra primero los datos del usuario en las demás tablas (best-effort,
  // vía función SQL), y luego el usuario de auth. Si delete_user_data
  // falla por algo no crítico, igual seguimos con el borrado del usuario.
  const { error: dataError } = await supabaseAdmin.rpc('delete_user_data', { p_user_id: userId })
  if (dataError) {
    console.error('delete_user_data error:', dataError.message)
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
