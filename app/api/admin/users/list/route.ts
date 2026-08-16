import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabaseAdmin = createAdminClient()

  // auth.admin.listUsers pagina de a 50 por defecto; traemos hasta 1000
  // en un solo request, suficiente para el tamaño actual de la app.
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, status, current_period_end')

  type SubRow = { user_id: string; status: string; current_period_end: string | null }
  const subsByUser = new Map<string, SubRow>(
    ((subscriptions ?? []) as SubRow[]).map((s) => [s.user_id, s])
  )

  const users = usersData.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      full_name: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      subscription_status: subsByUser.get(u.id)?.status ?? null,
      current_period_end: subsByUser.get(u.id)?.current_period_end ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ users })
}
