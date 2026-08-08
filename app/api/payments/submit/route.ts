import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { createAdminClient } from '@/lib/supabase-admin'
import { applyDiscount } from '@/lib/discount'

const PRICE_COP = Number(process.env.SUBSCRIPTION_PRICE_COP ?? process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000')

// Formato típico de un número de referencia/comprobante de Nequi: letras y
// números, sin espacios raros ni HTML.
const REFERENCE_REGEX = /^[A-Za-z0-9-]{4,30}$/

// Máximo de solicitudes (de cualquier estado) que un usuario puede crear
// en 24h, para frenar el spam de intentos.
const MAX_REQUESTS_PER_DAY = 5

export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user || !user.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const reference = String(body?.reference ?? '').trim()
  const proofPath = String(body?.proofPath ?? '').trim()
  const discountCodeRaw = body?.discountCode ? String(body.discountCode).trim().toUpperCase() : null

  if (!REFERENCE_REGEX.test(reference)) {
    return NextResponse.json(
      { error: 'El número de referencia no es válido (4-30 letras/números)' },
      { status: 400 }
    )
  }

  if (!proofPath.startsWith(`${user.id}/`)) {
    return NextResponse.json(
      { error: 'Debes adjuntar el comprobante de pago' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  // El comprobante debe existir realmente en el bucket privado y pertenecer
  // a este usuario (ya validamos el prefijo del path arriba).
  const fileName = proofPath.split('/').slice(1).join('/')
  const { data: files } = await supabaseAdmin.storage
    .from('payment-proofs')
    .list(user.id)
  const proofExists = files?.some((f) => `${user.id}/${f.name}` === proofPath || f.name === fileName)
  if (!proofExists) {
    return NextResponse.json({ error: 'No se encontró el comprobante subido' }, { status: 400 })
  }

  // Un usuario no puede tener dos solicitudes pendientes a la vez.
  const { data: pending } = await supabaseAdmin
    .from('payment_requests')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (pending) {
    return NextResponse.json(
      { error: 'Ya tienes una solicitud de pago pendiente de revisión' },
      { status: 409 }
    )
  }

  // Límite de intentos por día (anti-spam / anti-fuerza-bruta de referencias).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabaseAdmin
    .from('payment_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since)

  if ((count ?? 0) >= MAX_REQUESTS_PER_DAY) {
    return NextResponse.json(
      { error: 'Alcanzaste el máximo de intentos por hoy. Intenta más tarde.' },
      { status: 429 }
    )
  }

  // Ese mismo número de referencia no puede estar ya activo en otra solicitud
  // (además del índice único en la base de datos, esto da un mensaje claro).
  const { data: duplicate } = await supabaseAdmin
    .from('payment_requests')
    .select('id')
    .eq('reference_number', reference)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (duplicate) {
    return NextResponse.json(
      { error: 'Ese número de referencia ya fue usado en otra solicitud' },
      { status: 409 }
    )
  }

  // Canje atómico del código de descuento (si viene). La función en la base
  // de datos hace el chequeo de vigencia/cupo y el incremento en una sola
  // sentencia, así que dos personas no pueden "ganarle" al mismo cupo.
  let discountAmount = 0
  let finalAmount = PRICE_COP
  let redeemedCode: string | null = null

  if (discountCodeRaw) {
    const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc('redeem_discount_code', {
      p_code: discountCodeRaw,
    })

    if (redeemError || !redeemed || redeemed.length === 0) {
      return NextResponse.json({ error: 'Código de descuento inválido o vencido' }, { status: 400 })
    }

    const discount = redeemed[0]
    const result = applyDiscount(PRICE_COP, {
      type: discount.type as 'percentage' | 'fixed',
      value: Number(discount.value),
    })
    discountAmount = result.discountAmount
    finalAmount = result.finalAmount
    redeemedCode = discountCodeRaw
  }

  const { error: insertError } = await supabaseAdmin.from('payment_requests').insert({
    user_id: user.id,
    user_email: user.email,
    amount: PRICE_COP,
    reference_number: reference,
    status: 'pending',
    proof_path: proofPath,
    discount_code: redeemedCode,
    discount_amount: discountAmount,
    final_amount: finalAmount,
  })

  if (insertError) {
    // Si falló el insert después de canjear el código, liberamos el cupo.
    if (redeemedCode) {
      await supabaseAdmin.rpc('release_discount_code', { p_code: redeemedCode })
    }
    // El índice único de "referencia activa" o "un pendiente por usuario"
    // puede rechazar el insert por una condición de carrera; se informa igual.
    return NextResponse.json({ error: 'No se pudo registrar el pago. Intenta de nuevo.' }, { status: 409 })
  }

  return NextResponse.json({ success: true, finalAmount, discountAmount })
}
