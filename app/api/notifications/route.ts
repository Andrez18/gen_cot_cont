import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function userClient(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

// GET /api/notifications — listar notificaciones del usuario
export async function GET(req: Request) {
  const supabase = userClient(req)
  if (!supabase) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })

  return NextResponse.json({ notifications: data })
}

// PATCH /api/notifications — marcar como leída(s)
export async function PATCH(req: Request) {
  const supabase = userClient(req)
  if (!supabase) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { ids } = await req.json().catch(() => ({}))

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (ids && Array.isArray(ids) && ids.length > 0) {
    query = query.in('id', ids)
  } else {
    query = query.eq('read', false)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
