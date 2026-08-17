import { createClient } from '@supabase/supabase-js'

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

type NotificationType = 'info' | 'success' | 'warning' | 'error'

/**
 * Crea una notificación persistente para un usuario.
 * Se llama desde rutas API del servidor (usa service_role key).
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  message?: string
  link?: string
}) {
  const db = adminClient()
  const { error } = await db.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message: message ?? '',
    link: link ?? null,
  })
  if (error) console.error('createNotification error:', error.message)
}
