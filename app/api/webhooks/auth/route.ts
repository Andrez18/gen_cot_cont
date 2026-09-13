import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, welcomeEmail } from '@/lib/email'

// Webhook de Supabase Database Webhooks.
// Se dispara cuando un registro nuevo se inserta en la tabla subscriptions.
// El webhook de Supabase NO envía tokens de auth, así que usamos service_role.

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // El webhook de Supabase envía: { type: 'INSERT', table: 'subscriptions', record: {...} }
    if (body.type !== 'INSERT' || !body.record) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const record = body.record
    const userId = record.user_id
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no user_id' })
    }

    // Usar service_role para obtener datos del usuario (el webhook no envía token)
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: { user }, error } = await db.auth.admin.getUserById(userId)
    if (error || !user?.email) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'user not found' })
    }

    // No enviar si ya tiene trial (ya recibió bienvenida)
    if (record.trial_ends_at) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'trial user' })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotifactura.vercel.app'
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || ''

    const emailContent = welcomeEmail(userName, siteUrl)
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    })

    return NextResponse.json({ ok: true, sent: true })
  } catch (err) {
    console.error('Webhook auth error:', err)
    return NextResponse.json({ ok: true, error: 'Internal error' }, { status: 200 })
  }
}
