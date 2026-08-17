import type { SupabaseExpenseRecordRow } from '@/hooks/use-supabase-storage'

type InformeData = {
  fecha: string
  ingresos: number
  gastos: number
  balance: number
  gastos_por_cat: Record<string, number>
  gastosPorCat?: Record<string, number>
  total_registros: number
  totalRegistros?: number
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

async function shareFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch {
      // cancelado por usuario o error, usar fallback
    }
  }

  // Fallback: descargar y abrir WhatsApp
  downloadBlob(blob, filename)
  window.open('https://web.whatsapp.com/', '_blank', 'noopener,noreferrer')
}

export async function shareQuotationWhatsApp(
  quotationNumber: string,
  generatePdf: () => Promise<Blob>,
) {
  const blob = await generatePdf()
  await shareFile(blob, `Cotizacion-${quotationNumber}.pdf`)
}

export async function shareInvoiceWhatsApp(
  invoiceNumber: string,
  generatePdf: () => Promise<Blob>,
) {
  const blob = await generatePdf()
  await shareFile(blob, `CuentaCobro-${invoiceNumber}.pdf`)
}

export async function shareExpenseReportWhatsApp(
  index: number,
  enProgreso: boolean | undefined,
  generatePdf: () => Promise<Blob>,
) {
  const blob = await generatePdf()
  const nombre = enProgreso ? 'Informe-gastos-en-progreso' : `Informe-gastos-${index}`
  await shareFile(blob, `${nombre}.pdf`)
}
