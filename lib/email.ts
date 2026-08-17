// Envío de correos transaccionales (aprobar/rechazar pagos) usando el
// mismo Gmail SMTP que ya configuraste en Supabase para los correos de
// auth. Usamos nodemailer porque Gmail no tiene una API REST simple
// como Resend.
//
// Requiere las variables de entorno (las mismas credenciales que usaste
// en Supabase → Authentication → SMTP Settings):
//   GMAIL_USER          -> tu correo de Gmail, ej. dev.andrez18@gmail.com
//   GMAIL_APP_PASSWORD  -> la contraseña de aplicación de 16 caracteres
//                          (sin espacios), generada en
//                          myaccount.google.com/apppasswords
//
// Si no están configuradas, la función no lanza error: solo hace un log
// y sigue, para que la app nunca se rompa por un correo que no se pudo
// enviar (aprobar/rechazar un pago no debe fallar por esto).
import nodemailer from 'nodemailer'
import { withRetry } from './retry'

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL directo, igual que en Supabase
      auth: { user, pass },
    })
  }
  return cachedTransporter
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = getTransporter()
  const from = process.env.GMAIL_USER

  if (!transporter || !from) {
    console.warn('sendEmail: faltan GMAIL_USER o GMAIL_APP_PASSWORD, correo no enviado:', subject)
    return { sent: false }
  }

  try {
    await withRetry(() =>
      transporter.sendMail({
        from: `CotiFactura <${from}>`,
        to,
        subject,
        html,
      }),
    )
    return { sent: true }
  } catch (err) {
    console.error('sendEmail: error al enviar por Gmail SMTP tras reintentos', err)
    return { sent: false }
  }
}

// Envuelve el contenido de cualquier correo transaccional con la misma
// identidad visual de la landing y del formulario de auth: card negra,
// logo, botón pill blanco. Se usa para los correos de pago; los de auth
// (confirmación, recuperar contraseña) se configuran aparte en el
// Dashboard de Supabase con el mismo estilo.
function emailLayout({
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  heading: string
  bodyHtml: string
  ctaLabel: string
  ctaUrl: string
}) {
  return `
    <div style="background-color: #f5f5f5; padding: 40px 16px; font-family: Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background-color: #000000; border: 1px solid #17171a; border-radius: 24px; padding: 48px 40px;">

        <div style="text-align: center; margin-bottom: 32px;">
          <table role="presentation" style="margin: 0 auto;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color: #ffffff; border-radius: 10px; width: 28px; height: 28px; text-align: center; vertical-align: middle;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </td>
              <td style="padding-left: 10px; vertical-align: middle;">
                <span style="color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: -0.2px;">CotiFactura</span>
              </td>
            </tr>
          </table>
        </div>

        <h2 style="text-align: center; color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 24px;">
          ${heading}
        </h2>

        ${bodyHtml}

        <div style="text-align: center; margin: 32px 0 8px;">
          <a
            href="${ctaUrl}"
            style="
              display: inline-block;
              background-color: #ffffff;
              color: #0a0a0a;
              text-decoration: none;
              padding: 13px 32px;
              border-radius: 999px;
              font-size: 14px;
              font-weight: 600;
            "
          >
            ${ctaLabel}
          </a>
        </div>

        <div style="border-top: 1px solid #17171a; margin-top: 32px; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #4b5563; margin: 0;">
            © CotiFactura — Gestión sencilla para contratistas independientes.
          </p>
        </div>

      </div>
    </div>
  `
}

export function paymentApprovedEmail(siteUrl: string) {
  return {
    subject: '✅ Tu pago fue aprobado - CotiFactura',
    html: emailLayout({
      heading: '¡Tu pago fue aprobado!',
      bodyHtml: `
        <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; margin: 0;">
          Ya activamos tu suscripción a <strong style="color: #e4e2e5;">CotiFactura</strong>.
          Ya puedes entrar y seguir generando tus cotizaciones y cuentas de cobro sin límites.
        </p>
      `,
      ctaLabel: 'Abrir CotiFactura',
      ctaUrl: siteUrl,
    }),
  }
}

export function paymentRejectedEmail(siteUrl: string) {
  return {
    subject: 'Tu pago no pudo ser confirmado - CotiFactura',
    html: emailLayout({
      heading: 'No pudimos confirmar tu pago',
      bodyHtml: `
        <p style="font-size: 14px; line-height: 1.6; color: #9ca3af; margin: 0;">
          Revisamos tu comprobante y no pudimos validarlo (referencia incorrecta,
          monto no coincide, o comprobante ilegible). Puedes volver a intentarlo
          desde la app con un nuevo comprobante.
        </p>
      `,
      ctaLabel: 'Volver a intentar',
      ctaUrl: siteUrl,
    }),
  }
}
