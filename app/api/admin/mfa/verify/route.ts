import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { getEncryptedSecret, verifyTOTP, decryptSecret } from '@/lib/totp'

export async function POST(req: Request) {
  const admin = await requireAdmin(req as any)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { token } = await req.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 })
    }

    const encrypted = await getEncryptedSecret()
    if (!encrypted) {
      return NextResponse.json({ error: '2FA no está configurado' }, { status: 400 })
    }

    const secret = decryptSecret(encrypted)
    const valid = verifyTOTP(secret, token)

    if (!valid) {
      return NextResponse.json({ error: 'Código incorrecto. Intenta de nuevo.' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (err) {
    console.error('MFA verify error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al verificar: ${msg}` }, { status: 500 })
  }
}
