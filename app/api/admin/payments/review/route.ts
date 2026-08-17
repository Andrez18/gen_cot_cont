import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendEmail, paymentApprovedEmail, paymentRejectedEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/notifications'

const SUBSCRIPTION_DAYS = 30

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { requestId, action } = await req.json()
  if (!requestId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const now = new Date()

  // Update atómico condicionado a status = 'pending': si dos admins (o dos
  // clics) intentan revisar la misma solicitud a la vez, solo uno de los
  // updates afecta una fila; el otro recibe 0 filas y sabemos que ya fue
  // revisada, sin depender de un select previo que podría quedar obsoleto.
  const { data: updatedRows, error: updateError } = await supabaseAdmin
    .from('payment_requests')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: now.toISOString(),
      reviewed_by: admin.email,
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('*')

  if (updateError) {
    return NextResponse.json({ error: 'Error interno al procesar la solicitud' }, { status: 500 })
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: 'Esta solicitud ya fue revisada o no existe' },
      { status: 409 }
    )
  }

  const paymentRequest = updatedRows[0]

  if (action === 'approve') {
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('current_period_end')
      .eq('user_id', paymentRequest.user_id)
      .maybeSingle()

    const currentEnd = existing?.current_period_end ? new Date(existing.current_period_end) : null
    // Si ya tenía días vigentes, se acumulan en vez de pisar el periodo.
    const base = currentEnd && currentEnd > now ? currentEnd : now
    const newPeriodEnd = new Date(base)
    newPeriodEnd.setDate(newPeriodEnd.getDate() + SUBSCRIPTION_DAYS)

    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: paymentRequest.user_id,
        status: 'active',
        current_period_end: newPeriodEnd.toISOString(),
        updated_at: now.toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } else if (paymentRequest.discount_code) {
    // Si se rechaza el pago, liberamos el cupo del código de descuento que
    // se había canjeado al enviar la solicitud.
    await supabaseAdmin.rpc('release_discount_code', { p_code: paymentRequest.discount_code })
  }

  // Aviso por correo al usuario. Si falla el envío, no afecta la
  // aprobación/rechazo, que ya quedó guardada arriba.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cotifactura.vercel.app'
  const { subject, html } = action === 'approve'
    ? paymentApprovedEmail(siteUrl)
    : paymentRejectedEmail(siteUrl)
  const emailResult = await sendEmail({ to: paymentRequest.user_email, subject, html })
  if (!emailResult.sent) {
    logger.warn('Email de notificación de pago no enviado', { userId: paymentRequest.user_id, action })
  }

  logger.audit(`Pago ${action === 'approve' ? 'aprobado' : 'rechazado'}`, {
    userId: paymentRequest.user_id,
    path: `/api/admin/payments/review`,
    meta: { requestId, action, amount: paymentRequest.final_amount ?? paymentRequest.amount },
  })

  // Notificación in-app al usuario
  await createNotification({
    userId: paymentRequest.user_id,
    type: action === 'approve' ? 'success' : 'warning',
    title: action === 'approve' ? '¡Pago aprobado!' : 'Pago no confirmado',
    message: action === 'approve'
      ? 'Tu suscripción fue activada. Ya puedes generar documentos sin límites.'
      : 'Tu comprobante de pago no pudo ser validado. Puedes volver a intentarlo.',
    link: action === 'approve' ? '/history' : undefined,
  })

  return NextResponse.json({ success: true })
}
