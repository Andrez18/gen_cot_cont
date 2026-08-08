import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/require-user'
import { createAdminClient } from '@/lib/supabase-admin'
import { applyDiscount } from '@/lib/discount'

const PRICE_COP = Number(process.env.SUBSCRIPTION_PRICE_COP ?? process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP ?? '30000')

// Solo "previsualiza" el descuento: NO incrementa el contador de usos.
// El canje real y atómico ocurre en /api/payments/submit.
export async function POST(req: NextRequest) {
  const user = await requireUser(req)
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { code } = await req.json().catch(() => ({ code: '' }))
  const normalized = String(code ?? '').trim().toUpperCase()

  if (!normalized) {
    return NextResponse.json({ error: 'Ingresa un código' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const { data: discount } = await supabaseAdmin
    .from('discount_codes')
    .select('type, value, active, expires_at, max_uses, times_used')
    .eq('code', normalized)
    .maybeSingle()

  const now = new Date()
  const isValid =
    !!discount &&
    discount.active &&
    (!discount.expires_at || new Date(discount.expires_at) > now) &&
    (discount.max_uses == null || discount.times_used < discount.max_uses)

  if (!isValid) {
    return NextResponse.json({ error: 'Código inválido o vencido' }, { status: 404 })
  }

  const { discountAmount, finalAmount } = applyDiscount(PRICE_COP, {
    type: discount!.type as 'percentage' | 'fixed',
    value: Number(discount!.value),
  })

  return NextResponse.json({
    valid: true,
    code: normalized,
    amount: PRICE_COP,
    discountAmount,
    finalAmount,
  })
}
