import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { getAdminEmails } from './admin-roles'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_EMAIL = process.env.VAPID_EMAIL!

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_EMAIL) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getSubscriptions(userId: string) {
  const db = adminClient()
  const { data } = await db
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)
  return data ?? []
}

export async function getAdminUserIds(): Promise<string[]> {
  const db = adminClient()
  const adminEmails = await getAdminEmails()
  if (adminEmails.size === 0) return []

  // Recorrer todas las páginas buscando TODOS los admins (propietario y
  // adicionales); listUsers devuelve pocas filas por página.
  const PER_PAGE = 500
  const MAX_PAGES = 20
  const ids: string[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data: authUsers } = await db.auth.admin.listUsers({ page, perPage: PER_PAGE })
    if (!authUsers?.users?.length) break
    for (const u of authUsers.users) {
      const email = u.email?.toLowerCase().trim()
      if (email && adminEmails.has(email)) ids.push(u.id)
    }
    if (authUsers.users.length < PER_PAGE) break
  }
  return ids
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

  const subs = await getSubscriptions(userId)
  if (subs.length === 0) return

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? '/icon-192x192.png',
    badge: payload.badge ?? '/icon-192x192.png',
    url: payload.url ?? '/',
  })

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
      } catch (err: any) {
        // Si el endpoint ya no es válido (404 o 410), eliminar la suscripción
        if (err.statusCode === 404 || err.statusCode === 410) {
          const db = adminClient()
          await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        throw err
      }
    })
  )

  return results
}

export async function sendPushToAdmin(payload: PushPayload) {
  const adminIds = await getAdminUserIds()
  const results = await Promise.allSettled(
    adminIds.map(id => sendPushToUser(id, payload))
  )
  return results
}

// Notificar al admin cuando alguien envía un pago
export async function notifyAdminNewPayment(userEmail: string, amount: number) {
  await sendPushToAdmin({
    title: '💰 Nuevo pago pendiente',
    body: `${userEmail} envió un pago de $${amount.toLocaleString('es-CO')} COP para revisar.`,
    url: '/admin/payments',
  })
}

// Notificar al usuario cuando su pago es aprobado/rechazado
export async function notifyUserPaymentReview(
  userId: string,
  action: 'approved' | 'rejected',
) {
  const title = action === 'approved' ? '✅ Pago aprobado' : '❌ Pago rechazado'
  const body = action === 'approved'
    ? 'Tu pago fue aprobado. Tu suscripción ya está activa.'
    : 'Tu pago fue rechazado. revisa los detalles en la app.'

  await sendPushToUser(userId, { title, body, url: '/settings' })
}

// Notificar al usuario cuando su suscripción está por vencer
export async function notifyUserSubscriptionExpiring(userId: string, daysLeft: number) {
  await sendPushToUser(userId, {
    title: '⏰ Suscripción por vencer',
    body: daysLeft <= 0
      ? 'Tu suscripción ya venció. Renueva para seguir usando la app.'
      : `Tu suscripción vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}. Renueva a tiempo.`,
    url: '/settings',
  })
}

// Notificación de bienvenida al instalar la app
export async function notifyUserWelcome(userId: string) {
  await sendPushToUser(userId, {
    title: '🎉 ¡Bienvenido a CotiFactura!',
    body: 'La app está lista. Empieza a crear cotizaciones y facturas.',
    url: '/',
  })
}
