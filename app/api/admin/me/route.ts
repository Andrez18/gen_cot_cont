import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'

/**
 * Endpoint ligero para que el cliente determine si la sesión actual
 * pertenece a un admin (propietario o adicional). Devuelve 200 con
 * { isAdmin: true } o 401.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json({ isAdmin: true, email: admin.email })
}
