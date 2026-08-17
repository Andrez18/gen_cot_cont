import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = req.nextUrl
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit') ?? String(DEFAULT_LIMIT))))
  const search = url.searchParams.get('search')?.trim().toLowerCase() ?? ''

  const supabaseAdmin = createAdminClient()

  // Paginar auth users
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
    page,
    perPage: limit,
  })
  if (usersError) return NextResponse.json({ error: 'Error al obtener los usuarios' }, { status: 500 })

  const { data: subscriptions } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id, status, current_period_end')

  type SubRow = { user_id: string; status: string; current_period_end: string | null }
  const subsByUser = new Map<string, SubRow>(
    ((subscriptions ?? []) as SubRow[]).map((s) => [s.user_id, s])
  )

  let users = usersData.users
    .map((u) => ({
      id: u.id,
      email: u.email,
      full_name: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      subscription_status: subsByUser.get(u.id)?.status ?? null,
      current_period_end: subsByUser.get(u.id)?.current_period_end ?? null,
    }))

  // Filtrar por búsqueda si se proporciona
  if (search) {
    users = users.filter(
      (u) =>
        u.email?.toLowerCase().includes(search) ||
        u.full_name?.toLowerCase().includes(search)
    )
  }

  users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      // Nota: Supabase auth.listUsers no devuelve count total, solo la página actual
      // Para un panel admin completo, esto es suficiente
    },
  })
}
