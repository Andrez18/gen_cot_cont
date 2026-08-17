import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { disableMFA } from '@/lib/totp'

export async function POST(req: Request) {
  const admin = await requireAdmin(req as any)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    await disableMFA()
    return NextResponse.json({ disabled: true })
  } catch (err) {
    console.error('MFA disable error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al desactivar: ${msg}` }, { status: 500 })
  }
}
