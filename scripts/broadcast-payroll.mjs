/**
 * Difunde una notificación (in-app + Web Push) a TODOS los usuarios de la
 * aplicación anunciando una nueva función. Pensado para ejecutarse una vez
 * desde el equipo del administrador:
 *
 *   node scripts/broadcast-payroll.mjs
 *
 * Requiere en .env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_EMAIL (opcional,
 *   si faltan solo se omite el push y queda la notificación in-app)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import webPush from 'web-push'

/* ── carga manual del .env (sin dependencias) ─────────────────────────── */
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let env = {}
try {
  env = Object.fromEntries(
    readFileSync(join(root, '.env'), 'utf8')
      .split(/\r?\n/)
      .filter(l => l.trim() && !l.trim().startsWith('#'))
      .map(l => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
      }),
  )
} catch {
  console.error('No se pudo leer el archivo .env')
  process.exit(1)
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(URL_, KEY)

const NOTIFICATION = {
  type: 'info',
  title: 'NUEVO: Nómina',
  message:
    'Ya puedes liquidar el pago de tus trabajadores por hora, día, quincena, mes u obra, con cálculos de Colombia 2026 y PDF descargable.',
  link: '/payroll',
}

/* ── traer todos los usuarios (paginado) ──────────────────────────────── */
async function getAllUsers() {
  const users = []
  let page = 1
  const perPage = 200
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...(data?.users ?? []))
    if (!data?.users || data.users.length < perPage) break
    page += 1
  }
  return users
}

async function main() {
  console.log('Obteniendo usuarios...')
  const users = await getAllUsers()
  console.log(`Usuarios encontrados: ${users.length}`)
  if (users.length === 0) return

  /* ── notificaciones persistentes (inserción por lotes) ──────────────── */
  const BATCH = 400
  let inserted = 0
  for (let i = 0; i < users.length; i += BATCH) {
    const rows = users.slice(i, i + BATCH).map(u => ({
      user_id: u.id,
      type: NOTIFICATION.type,
      title: NOTIFICATION.title,
      message: NOTIFICATION.message,
      link: NOTIFICATION.link,
    }))
    const { error } = await db.from('notifications').insert(rows)
    if (error) {
      console.error(`Lote ${i}: ${error.message}`)
      continue
    }
    inserted += rows.length
  }
  console.log(`Notificaciones in-app creadas: ${inserted}`)

  /* ── web push (si hay llaves VAPID) ─────────────────────────────────── */
  const pub = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = env.VAPID_PRIVATE_KEY
  const mail = env.VAPID_EMAIL
  if (!pub || !priv || !mail) {
    console.log('Sin llaves VAPID: se omiten los push.')
    return
  }

  webPush.setVapidDetails(mail, pub, priv)
  const { data: subs } = await db.from('push_subscriptions').select('user_id, endpoint, p256dh, auth')
  if (!subs || subs.length === 0) {
    console.log('Sin suscripciones push registradas.')
    return
  }

  const payload = JSON.stringify({
    title: NOTIFICATION.title,
    body: NOTIFICATION.message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    url: NOTIFICATION.link ?? '/',
  })

  let sent = 0
  let removed = 0
  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
      sent += 1
    } catch (err) {
      // Endpoint vencido: se elimina para no acumular basura
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        removed += 1
      }
    }
  }
  console.log(`Push enviados: ${sent} · endpoints inválidos eliminados: ${removed}`)
}

main().catch(err => {
  console.error('Error:', err.message ?? err)
  process.exit(1)
})
