import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { getMFAStatus } from '@/lib/totp'

export async function GET(req: Request) {
  const admin = await requireAdmin(req as any)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const status = await getMFAStatus()
    return NextResponse.json(status)
  } catch (err) {
    console.error('MFA status error:', err)
    return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 })
  }
}
