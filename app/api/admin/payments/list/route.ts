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
  const status = url.searchParams.get('status') // 'pending' | 'approved' | 'rejected' | null (all)
  const offset = (page - 1) * limit

  const supabaseAdmin = createAdminClient()

  let query = supabaseAdmin
    .from('payment_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: 'Error al obtener los pagos' }, { status: 500 })

  return NextResponse.json({
    requests: data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}
