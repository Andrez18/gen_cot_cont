import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/reset-password-form'

// Página pública: se llega acá desde el enlace del correo de recuperación.
export const metadata: Metadata = {
  title: 'Restablecer contraseña',
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />
}
