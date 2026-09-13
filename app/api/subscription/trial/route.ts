import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  // Verificar si ya tiene suscripción activa o trial
  const { data: existing } = await db
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.status === 'active') {
    return NextResponse.json({ error: 'Ya tienes una suscripción activa' }, { status: 400 })
  }

  if (existing?.trial_ends_at && new Date(existing.trial_ends_at) > new Date()) {
    return NextResponse.json({ error: 'Ya tienes un trial activo' }, { status: 400 })
  }

  // Iniciar trial de 7 días
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 7)

  const { error: upsertError } = await db
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      status: 'active',
      current_period_end: trialEnd.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
    }, { onConflict: 'user_id' })

  if (upsertError) {
    console.error('Error starting trial:', upsertError)
    return NextResponse.json({ error: 'No se pudo iniciar el trial' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, trialEndsAt: trialEnd.toISOString() })
}
