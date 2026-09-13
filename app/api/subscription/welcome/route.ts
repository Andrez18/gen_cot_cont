import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, welcomeEmail } from '@/lib/email'

// Endpoint para enviar email de bienvenida después del registro.
// Soporta 2 modos:
// 1. Con session (Bearer token) - usuario ya confirmó email
// 2. Sin session (user_id en body) - usuario pendiente de confirmar

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const body = await req.json().catch(() => ({}))
  const userId = body?.user_id

  // Necesitamos token o user_id
  if (!authHeader && !userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  let email = ''
  let userName = ''

  if (authHeader) {
    // Modo 1: con session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    email = user.email
    userName = user.user_metadata?.full_name || user.user_metadata?.name || ''
  } else {
    // Modo 2: sin session, usar service_role para obtener datos
    const { data: { user }, error } = await db.auth.admin.getUserById(userId)
    if (error || !user?.email) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'user not found' })
    }
    email = user.email
    userName = user.user_metadata?.full_name || user.user_metadata?.name || ''
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotifactura.vercel.app'
  const emailContent = welcomeEmail(userName, siteUrl)
  await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
  })

  return NextResponse.json({ ok: true, sent: true })
}
