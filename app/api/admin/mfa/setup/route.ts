import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { createTOTP, generateQRData, encryptSecret, enableMFA, getMFAStatus } from '@/lib/totp'

export async function POST(req: Request) {
  const admin = await requireAdmin(req as any)
  if (!admin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!process.env.MFA_ENCRYPTION_KEY) {
    return NextResponse.json(
      { error: 'Falta MFA_ENCRYPTION_KEY en .env. Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"' },
      { status: 500 },
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env' },
      { status: 500 },
    )
  }

  const status = await getMFAStatus()
  if (status.enabled) {
    return NextResponse.json({ error: '2FA ya está habilitado. Desactívalo primero.' }, { status: 400 })
  }

  try {
    const totp = createTOTP()
    const qrData = generateQRData(totp)
    const base32Secret = totp.secret.base32
    const encrypted = encryptSecret(base32Secret)

    await enableMFA(encrypted)

    return NextResponse.json({
      qrData,
      secret: base32Secret,
      message: 'Escanea el código QR con tu app de autenticación y verifica con un código de 6 dígitos.',
    })
  } catch (err) {
    console.error('MFA setup error:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error al configurar 2FA: ${msg}` }, { status: 500 })
  }
}
