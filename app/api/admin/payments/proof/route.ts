import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createAdminClient } from '@/lib/supabase-admin'

// Devuelve una URL firmada de corta duración para ver el comprobante de un
// pago. El bucket es privado, así que solo el admin (vía service_role)
// puede generar este enlace, y expira rápido para no dejarlo circulando.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Falta el parámetro path' }, { status: 400 })

  // Sanitizar contra path traversal
  if (path.includes('..') || path.includes('%2e%2e') || path.includes('%2E%2E')) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Confirmamos que el pedido de firma corresponde a un payment_request real,
  // para que el admin no pueda usar esta ruta como un lector genérico del bucket.
  const { data: paymentRequest } = await supabaseAdmin
    .from('payment_requests')
    .select('id')
    .eq('proof_path', path)
    .maybeSingle()

  if (!paymentRequest) {
    return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
  }

  const fileName = path.split('/').slice(1).join('/')
  const folder = path.split('/')[0]

  const { data, error } = await supabaseAdmin.storage
    .from('payment-proofs')
    .createSignedUrl(`${folder}/${fileName}`, 60)

  if (error || !data) {
    return NextResponse.json({ error: 'No se pudo generar el enlace' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl })
}
