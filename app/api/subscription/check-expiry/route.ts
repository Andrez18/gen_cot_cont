import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyUserSubscriptionExpiring } from '@/lib/push'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: sub } = await db
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!sub || sub.status !== 'active' || !sub.current_period_end) {
    return NextResponse.json({ ok: true, notified: false })
  }

  const endDate = new Date(sub.current_period_end)
  const now = new Date()
  const msLeft = endDate.getTime() - now.getTime()
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

  // Notificar si faltan 3 días o menos (o ya venció)
  if (daysLeft <= 3) {
    await notifyUserSubscriptionExpiring(user.id, daysLeft)
    return NextResponse.json({ ok: true, notified: true, daysLeft })
  }

  return NextResponse.json({ ok: true, notified: false, daysLeft })
}
