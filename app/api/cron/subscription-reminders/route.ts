import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, subscriptionExpiringEmail } from '@/lib/email'

// Cron job para enviar recordatorios de suscripción por vencer
// Ejecutar diariamente via Vercel Cron o similar
// GET /api/cron/subscription-reminders
// Requiere CRON_SECRET para autenticación

export async function GET(req: Request) {
  // Verificar autenticación del cron job
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotifactura.vercel.app'

  // Buscar suscripciones que vencen en 7, 3 o 1 día
  const now = new Date()
  const reminders = [7, 3, 1]
  let emailsSent = 0

  for (const days of reminders) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + days)
    const targetStr = targetDate.toISOString().split('T')[0]

    // Buscar suscripciones que vencen exactamente en X días
    const { data: subs } = await db
      .from('subscriptions')
      .select('user_id, current_period_end')
      .eq('status', 'active')
      .not('trial_ends_at', 'is', null)
      .gte('current_period_end', `${targetStr}T00:00:00`)
      .lte('current_period_end', `${targetStr}T23:59:59`)

    if (!subs || subs.length === 0) continue

    for (const sub of subs) {
      // Obtener email del usuario
      const { data: { user } } = await db.auth.admin.getUserById(sub.user_id)
      if (!user?.email) continue

      // Enviar email de recordatorio
      const emailContent = subscriptionExpiringEmail(days, siteUrl)
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
      emailsSent++
    }
  }

  return NextResponse.json({ ok: true, emailsSent })
}
