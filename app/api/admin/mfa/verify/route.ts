import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { getEncryptedSecret, verifyTOTP, decryptSecret, signMfaToken, getMFAStatus } from '@/lib/totp'

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

    if (!process.env.MFA_ENCRYPTION_KEY) {
      return NextResponse.json({ error: 'Falta MFA_ENCRYPTION_KEY en .env del servidor' }, { status: 500 })
    }

    const status = await getMFAStatus()
    if (!status.enabled) {
      return NextResponse.json({ error: '2FA no está habilitado.' }, { status: 400 })
    }

    const encrypted = await getEncryptedSecret()
    if (!encrypted) {
      return NextResponse.json({ error: 'Secret 2FA no encontrado en DB.' }, { status: 400 })
    }

    const secret = decryptSecret(encrypted)
    const valid = verifyTOTP(secret, token)

    if (!valid) {
      return NextResponse.json({ error: 'Código incorrecto. Verifica tu app de autenticación e intenta de nuevo.' }, { status: 400 })
    }

    const mfaToken = signMfaToken(admin.email!)

    return NextResponse.json({ verified: true, mfaToken })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al verificar: ${msg}` }, { status: 500 })
  }
}
