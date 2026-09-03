/* =========================================================
   GENERADOR DE NÓMINA EN PDF — TEXTO REAL (seleccionable)

   A diferencia de las cotizaciones/cuentas de cobro (que se
   capturan como imagen con html2canvas), este documento se
   dibuja directamente con la API de jsPDF: el texto se puede
   seleccionar y copiar como en cualquier PDF normal.

   Diseño:
   - Banda de encabezado negra redondeada (identidad de la app)
     con título, periodo, número, empresa y fecha.
   - Fila de tarjetas resumen: trabajadores, días y neto total.
   - Tabla con cabecera sombreada y filas cebra.
   - Caja de totales destacada.
   - Pie con aviso legal y enlace "Generado con CotiFactura"
     (ocultable desde Configuración).
   ========================================================= */

import { formatCurrency } from '@/lib/document-utils'
import { PAYMENT_TYPE_LABELS, PAYROLL_CONSTANTS, type PayrollPaymentType } from '@/lib/payroll'

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://cotifactura.vercel.app'

export interface PayrollPdfData {
  number: string
  /** Nombre visible de la liquidación; si falta se usa un título genérico. */
  name?: string
  periodLabel: string
  companyName?: string
  companyNit?: string
  lines: Array<{
    fullName: string
    documentNumber?: string | null
    paymentType: PayrollPaymentType
    daysWorked?: number
    holidayDayRate?: number
    result: {
      neto: number
      holidayDays?: number
      holidayPay?: number
      totalDevengados?: number
      totalDeducciones?: number
    }
  }>
}

/* Geometría de página (mm) */
const PAGE_W = 210
const PAGE_H = 297
const ML = 14 // margen izquierdo
const MR = 14 // margen derecho
const CONTENT_W = PAGE_W - ML - MR

/* Paleta */
const INK: [number, number, number] = [17, 17, 20]
const WHITE: [number, number, number] = [255, 255, 255]
const GRAY_SOFT: [number, number, number] = [156, 163, 175]
const GRAY_LABEL: [number, number, number] = [110, 110, 116]
const CARD_BG: [number, number, number] = [246, 246, 248]
const BAR_BG: [number, number, number] = [241, 241, 244]
const ZEBRA_BG: [number, number, number] = [250, 250, 251]

/* Columnas: Trabajador | Forma de pago | Días | Valor por día | Neto */
const COL_NAME_X = ML
const COL_TYPE_X = 68
const COL_DAYS_RIGHT = 122
const COL_PER_DAY_RIGHT = 158
const COL_NETO_RIGHT = PAGE_W - MR
const ROW_H = 7

type Pdf = import('jspdf').jsPDF

function fitText(pdf: Pdf, text: string, maxMm: number): string {
  if (pdf.getTextWidth(text) <= maxMm) return text
  let t = text
  while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxMm) t = t.slice(0, -1)
  return `${t}…`
}

export async function buildPayrollPdf(
  data: PayrollPdfData,
  options: { branding?: boolean } = {},
): Promise<Pdf> {
  const branding = options.branding !== false
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

  let y = 0

  /* ── Banda de encabezado (solo primera página) ────────────────────── */
  const bandX = ML
  const bandY = 12
  const bandW = CONTENT_W
  const bandH = 30
  const padX = 6

  pdf.setFillColor(...INK)
  pdf.roundedRect(bandX, bandY, bandW, bandH, 3, 3, 'F')

  /* Lado izquierdo: marca, título y periodo */
  const leftX = bandX + padX
  let ly = bandY + 8
  if (branding) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(...GRAY_SOFT)
    pdf.text('C O T I F A C T U R A', leftX, ly)
    ly += 7
  }
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(255, 255, 255)
  pdf.text(fitText(pdf, data.name?.trim() || 'Liquidación de Nómina', 100), leftX, ly)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(...GRAY_SOFT)
  pdf.text(data.periodLabel || '', leftX, ly + 5.5)

  /* Lado derecho: número, empresa y fecha */
  const rightX = bandX + bandW - padX
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(`#${data.number}`, rightX, bandY + 9, { align: 'right' })

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(210, 210, 214)
  if (data.companyName) {
    pdf.text(
      fitText(pdf, `${data.companyName}${data.companyNit ? ` · NIT/CC ${data.companyNit}` : ''}`, 72),
      rightX,
      bandY + 14,
      { align: 'right' },
    )
  }
  pdf.setFontSize(7.5)
  pdf.setTextColor(...GRAY_SOFT)
  pdf.text(
    `Generada: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    rightX,
    bandY + 18.5,
    { align: 'right' },
  )

  /* ── Expandir filas: festivos/dominicales como fila separada ─────── */
  interface ExpandedRow {
    fullName: string
    documentNumber?: string | null
    paymentType: PayrollPaymentType
    days: number
    ratePerDay: number
    net: number
    isHoliday: boolean
  }

  const expandLines = (): ExpandedRow[] => {
    const expanded: ExpandedRow[] = []
    for (const l of data.lines) {
      const normalDays = l.daysWorked ?? 0
      const holidayDays = l.result.holidayDays ?? 0
      const holidayPay = l.result.holidayPay ?? 0
      const holidayRate = l.holidayDayRate ?? PAYROLL_CONSTANTS.PAGO_FESTIVO_DEFAULT
      const totalDev = l.result.totalDevengados ?? 0
      const totalDed = l.result.totalDeducciones ?? 0
      const neto = l.result.neto ?? 0

      if (holidayDays > 0) {
        const holidayNet = totalDev > 0
          ? Math.round(holidayPay - (holidayPay / totalDev) * totalDed)
          : holidayPay
        const normalNet = neto - holidayNet

        if (normalDays > 0) {
          expanded.push({
            fullName: l.fullName,
            documentNumber: l.documentNumber,
            paymentType: l.paymentType,
            days: normalDays,
            ratePerDay: normalDays > 0 ? Math.round(normalNet / normalDays) : 0,
            net: normalNet,
            isHoliday: false,
          })
        }
        expanded.push({
          fullName: l.fullName,
          documentNumber: l.documentNumber,
          paymentType: l.paymentType,
          days: holidayDays,
          ratePerDay: holidayRate,
          net: holidayNet,
          isHoliday: true,
        })
      } else {
        expanded.push({
          fullName: l.fullName,
          documentNumber: l.documentNumber,
          paymentType: l.paymentType,
          days: normalDays,
          ratePerDay: normalDays > 0 ? Math.round(neto / normalDays) : 0,
          net: neto,
          isHoliday: false,
        })
      }
    }
    return expanded
  }

  const expandedRows = expandLines()

  const totalNeto = expandedRows.reduce((s, r) => s + r.net, 0)
  const totalDays = expandedRows.filter(r => !r.isHoliday).reduce((s, r) => s + r.days, 0)
  const totalFest = expandedRows.filter(r => r.isHoliday).reduce((s, r) => s + r.days, 0)

  /* ── Tarjetas resumen ──────────────────────────────────────────────── */
  const gap = 4
  const cardW = (CONTENT_W - 2 * gap) / 3
  const cardH = 17
  const cardsY = bandY + bandH + 8

  const cards: Array<{ label: string; value: string; dark?: boolean }> = [
    { label: 'TRABAJADORES', value: String(data.lines.length) },
    { label: 'DÍAS DEL PERIODO', value: String(totalDays || '—') },
    { label: 'NETO TOTAL A PAGAR', value: formatCurrency(totalNeto), dark: true },
  ]

  cards.forEach((card, i) => {
    const cx = ML + i * (cardW + gap)
    pdf.setFillColor(...(card.dark ? INK : CARD_BG))
    pdf.roundedRect(cx, cardsY, cardW, cardH, 2.5, 2.5, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(...(card.dark ? GRAY_SOFT : GRAY_LABEL))
    pdf.text(card.label, cx + 5, cardsY + 6.5)

    pdf.setFontSize(11.5)
    pdf.setTextColor(...(card.dark ? WHITE : INK))
    pdf.text(
      fitText(pdf, card.value, cardW - 10),
      cx + 5,
      cardsY + 13,
    )
  })

  y = cardsY + cardH + 9

  /* ── Cabecera de tabla (se repite en cada página) ─────────────────── */
  const drawTableHeader = () => {
    const barH = 6.5
    pdf.setFillColor(...BAR_BG)
    pdf.rect(ML, y, CONTENT_W, barH, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(...GRAY_LABEL)
    const labels = [
      ['TRABAJADOR', COL_NAME_X + 1.5, 'left'],
      ['FORMA DE PAGO', COL_TYPE_X, 'left'],
      ['DÍAS TRAB.', COL_DAYS_RIGHT, 'right'],
      ['VALOR POR DÍA', COL_PER_DAY_RIGHT, 'right'],
      ['NETO A PAGAR', COL_NETO_RIGHT, 'right'],
    ] as const
    for (const [label, x, align] of labels) {
      pdf.text(label, x, y + barH - 2.2, { align })
    }

    y += barH + 4.4
  }

  /* ── Pie de página ────────────────────────────────────────────────── */
  const drawFooter = () => {
    const fy = PAGE_H - 12
    pdf.setDrawColor(228, 228, 232)
    pdf.setLineWidth(0.3)
    pdf.line(ML, fy - 3, PAGE_W - MR, fy - 3)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.8)
    pdf.setTextColor(...GRAY_SOFT)
    pdf.text(
      'Documento informativo, no reemplaza asesoría contable o laboral.',
      ML,
      fy + 1.5,
    )
    if (branding) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8)
      pdf.setTextColor(...INK)
      const brand = 'Generado con CotiFactura'
      pdf.textWithLink(brand, COL_NETO_RIGHT - pdf.getTextWidth(brand), fy + 1.5, { url: APP_URL })
    }
  }

  /** Garantiza espacio antes de dibujar una fila; pagina si hace falta. */
  const ensureSpace = () => {
    if (y > PAGE_H - 34) {
      drawFooter()
      pdf.addPage()
      y = 20
      drawTableHeader()
    }
  }

  drawTableHeader()

  /* ── Filas ────────────────────────────────────────────────────────── */
  expandedRows.forEach((r, i) => {
    ensureSpace()

    // Fondo cebra
    if (i % 2 === 1) {
      pdf.setFillColor(...ZEBRA_BG)
      pdf.rect(ML, y - 4.4, CONTENT_W, ROW_H, 'F')
    }

    const baseline = y

    // Trabajador (+ documento en gris)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    const docSuffix = r.documentNumber ? ` · ${r.documentNumber}` : ''
    const nameText = fitText(pdf, r.fullName, 52 - pdf.getTextWidth(docSuffix))
    pdf.setTextColor(...INK)
    pdf.text(nameText, COL_NAME_X + 1.5, baseline)
    if (docSuffix) {
      pdf.setTextColor(...GRAY_SOFT)
      pdf.setFontSize(7.5)
      pdf.text(docSuffix, COL_NAME_X + 1.5 + pdf.getTextWidth(nameText), baseline)
    }

    // Forma de pago
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(85, 85, 90)
    const typeLabel = r.isHoliday ? 'Día festivo / dominical' : PAYMENT_TYPE_LABELS[r.paymentType]
    pdf.text(fitText(pdf, typeLabel, 30), COL_TYPE_X, baseline)

    // Días
    pdf.setFontSize(8.5)
    pdf.setTextColor(...INK)
    pdf.text(String(r.days || '—'), COL_DAYS_RIGHT, baseline, { align: 'right' })

    // Valor por día
    pdf.setTextColor(...INK)
    pdf.text(
      r.days > 0 ? formatCurrency(r.ratePerDay) : '—',
      COL_PER_DAY_RIGHT,
      baseline,
      { align: 'right' },
    )

    // Neto a pagar
    pdf.setFont('helvetica', 'bold')
    pdf.text(formatCurrency(r.net), COL_NETO_RIGHT, baseline, { align: 'right' })

    pdf.setDrawColor(235, 235, 238)
    pdf.setLineWidth(0.2)
    pdf.line(ML, y + 2.6, PAGE_W - MR, y + 2.6)
    y += ROW_H
  })

  /* ── Totales (caja destacada) ─────────────────────────────────────── */
  ensureSpace()
  y += 1
  const boxH = 15
  pdf.setFillColor(...CARD_BG)
  pdf.roundedRect(ML, y - 1, CONTENT_W, boxH, 2.5, 2.5, 'F')

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...INK)
  pdf.text(
    `TOTALES (${data.lines.length} trabajador${data.lines.length !== 1 ? 'es' : ''})`,
    ML + 5,
    y + 5.2,
  )

  const totalsDaysText = String(totalDays || '—')
  if (totalFest > 0 && totalDays > 0) {
    const festText = ` +${totalFest} fest.`
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...GRAY_SOFT)
    pdf.text(festText, COL_DAYS_RIGHT, y + 5.2, { align: 'right' })
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...INK)
    pdf.text(totalsDaysText, COL_DAYS_RIGHT - pdf.getTextWidth(festText), y + 5.2, { align: 'right' })
  } else {
    pdf.text(totalsDaysText, COL_DAYS_RIGHT, y + 5.2, { align: 'right' })
  }

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...GRAY_LABEL)
  pdf.text('NETO TOTAL', ML + 5, y + 10.8)

  pdf.setFontSize(12)
  pdf.setTextColor(...INK)
  pdf.text(formatCurrency(totalNeto), COL_NETO_RIGHT, y + 10.8, { align: 'right' })

  y += boxH

  drawFooter()

  return pdf
}
