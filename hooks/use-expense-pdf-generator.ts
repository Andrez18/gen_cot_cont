'use client'

import { useCallback, useState } from 'react'
import { formatCurrency } from '@/lib/document-utils'

interface Registro {
  id?: string
  descripcion?: string
  cat?: string
  fecha?: string
  monto?: number
  tipo?: 'ingreso' | 'gasto'
}

interface Informe {
  fecha?: string
  ingresos?: number
  gastos?: number
  balance?: number
  gastos_por_cat?: Record<string, number>
  gastosPorCat?: Record<string, number>
  total_registros?: number
  totalRegistros?: number
}

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 15
const CONTENT_W = PAGE_W - MARGIN * 2

export function useExpensePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateExpensePdf = useCallback(async (
    informe: Informe,
    registros: Registro[],
    opts: { index: number; enProgreso?: boolean; filename: string }
  ) => {
    setIsGenerating(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })

      const balance = informe.balance ?? 0
      const ingresos = informe.ingresos ?? 0
      const gastos = informe.gastos ?? 0
      const gastosPorCat = informe.gastos_por_cat ?? informe.gastosPorCat ?? {}
      const totalRegistros = informe.total_registros ?? informe.totalRegistros ?? registros.length

      const isPositive = balance >= 0
      const mainColor: [number, number, number] = isPositive ? [6, 95, 70] : [153, 27, 27]
      const mainColorDark: [number, number, number] = isPositive ? [4, 78, 56] : [69, 10, 10]
      const lightBg: [number, number, number] = isPositive ? [240, 253, 244] : [254, 242, 242]
      const lightBorder: [number, number, number] = isPositive ? [187, 247, 208] : [254, 202, 202]

      let y = 0

      // ---------- Encabezado (banda de color) ----------
      const headerH = 42
      pdf.setFillColor(...mainColorDark)
      pdf.rect(0, 0, PAGE_W, headerH, 'F')
      // degradado simulado con franjas suaves
      pdf.setFillColor(...mainColor)
      pdf.rect(0, 0, PAGE_W, headerH * 0.6, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Informe de Gastos e Ingresos', MARGIN, 16)

      // badge de estado
      const badgeText = opts.enProgreso ? 'EN PROGRESO' : `INFORME #${opts.index}`
      pdf.setFontSize(8.5)
      const badgeW = pdf.getTextWidth(badgeText) + 6
      pdf.setFillColor(255, 255, 255)
      pdf.setDrawColor(255, 255, 255)
      pdf.roundedRect(MARGIN, 20, badgeW, 6, 3, 3, 'F')
      pdf.setTextColor(...mainColorDark)
      pdf.setFont('helvetica', 'bold')
      pdf.text(badgeText, MARGIN + 3, 24.2)

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const fechaTexto = informe.fecha ?? new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      pdf.text(fechaTexto, MARGIN, 33)

      // balance a la derecha
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const balLabel = 'BALANCE FINAL'
      pdf.text(balLabel, PAGE_W - MARGIN, 14, { align: 'right' })
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text(formatCurrency(balance), PAGE_W - MARGIN, 23, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.text(`${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''}`, PAGE_W - MARGIN, 29, { align: 'right' })

      y = headerH + 12

      // ---------- Tarjetas resumen ----------
      const cardGap = 5
      const cardW = (CONTENT_W - cardGap * 2) / 3
      const cardH = 20
      const cards: { label: string; value: number; color: [number, number, number]; bg: [number, number, number]; border: [number, number, number] }[] = [
        { label: 'INGRESOS', value: ingresos, color: [6, 95, 70], bg: [240, 253, 244], border: [187, 247, 208] },
        { label: 'GASTOS', value: gastos, color: [153, 27, 27], bg: [254, 242, 242], border: [254, 202, 202] },
        { label: 'BALANCE', value: balance, color: mainColor, bg: lightBg, border: lightBorder },
      ]
      cards.forEach((c, i) => {
        const x = MARGIN + i * (cardW + cardGap)
        pdf.setFillColor(...c.bg)
        pdf.setDrawColor(...c.border)
        pdf.roundedRect(x, y, cardW, cardH, 2.5, 2.5, 'FD')
        pdf.setTextColor(107, 114, 128)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7.5)
        pdf.text(c.label, x + 4, y + 7)
        pdf.setTextColor(...c.color)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(11)
        pdf.text(formatCurrency(c.value), x + 4, y + 15)
      })
      y += cardH + 12

      // ---------- Gastos por categoría ----------
      const catEntries = Object.entries(gastosPorCat)
      if (catEntries.length > 0) {
        pdf.setFillColor(153, 27, 27)
        pdf.rect(MARGIN, y, 1.2, 4, 'F')
        pdf.setTextColor(17, 24, 39)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text('Gastos por categoría', MARGIN + 4, y + 3.5)
        y += 9

        const maxCat = Math.max(...catEntries.map(([, v]) => v as number), 1)
        catEntries.forEach(([cat, total]) => {
          checkPageBreak(14)
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(9)
          pdf.setTextColor(55, 65, 81)
          pdf.text(cat, MARGIN, y)
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(153, 27, 27)
          pdf.text(formatCurrency(total as number), PAGE_W - MARGIN, y, { align: 'right' })
          y += 2.5
          // barra
          const barW = CONTENT_W
          const pct = Math.max(((total as number) / maxCat), 0.04)
          pdf.setFillColor(243, 244, 246)
          pdf.roundedRect(MARGIN, y, barW, 2.2, 1.1, 1.1, 'F')
          pdf.setFillColor(185, 28, 28)
          pdf.roundedRect(MARGIN, y, barW * pct, 2.2, 1.1, 1.1, 'F')
          y += 7
        })
        y += 3
      }

      // ---------- Tabla de registros ----------
      function checkPageBreak(needed: number) {
        if (y + needed > PAGE_H - MARGIN) {
          pdf.addPage()
          y = MARGIN
        }
      }

      const colDesc = MARGIN
      const colCat = MARGIN + CONTENT_W * 0.46
      const colFecha = MARGIN + CONTENT_W * 0.68
      const colMonto = PAGE_W - MARGIN

      function drawTableHeader() {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(MARGIN, y, CONTENT_W, 7, 'F')
        pdf.setDrawColor(229, 231, 235)
        pdf.line(MARGIN, y + 7, PAGE_W - MARGIN, y + 7)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7.5)
        pdf.setTextColor(156, 163, 175)
        pdf.text('DESCRIPCIÓN', colDesc + 2, y + 4.6)
        pdf.text('CATEGORÍA', colCat, y + 4.6)
        pdf.text('FECHA', colFecha, y + 4.6)
        pdf.text('MONTO', colMonto, y + 4.6, { align: 'right' })
        y += 7
      }

      if (registros.length > 0) {
        checkPageBreak(20)
        pdf.setFillColor(17, 24, 39)
        pdf.rect(MARGIN, y, 1.2, 4, 'F')
        pdf.setTextColor(17, 24, 39)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(10)
        pdf.text('Detalle de registros', MARGIN + 4, y + 3.5)
        y += 9

        drawTableHeader()

        registros.forEach((r, i) => {
          checkPageBreak(9)
          // si se rompió la página, redibujar header si estamos al inicio de una nueva página
          if (y === MARGIN) {
            drawTableHeader()
          }
          const rowH = 8
          if (i % 2 === 0) {
            pdf.setFillColor(255, 255, 255)
          } else {
            pdf.setFillColor(250, 250, 250)
          }
          pdf.rect(MARGIN, y, CONTENT_W, rowH, 'F')

          pdf.setFont('helvetica', 'bold')
          pdf.setFontSize(8.5)
          pdf.setTextColor(17, 24, 39)
          const descTrunc = pdf.splitTextToSize(r.descripcion ?? '', (colCat - colDesc) - 4)[0] ?? ''
          pdf.text(descTrunc, colDesc + 2, y + 5.3)

          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(107, 114, 128)
          pdf.text(r.cat || '—', colCat, y + 5.3)
          pdf.text(r.fecha || '', colFecha, y + 5.3)

          const isIngreso = r.tipo === 'ingreso'
          pdf.setFont('helvetica', 'bold')
          pdf.setTextColor(...(isIngreso ? ([6, 95, 70] as [number, number, number]) : ([153, 27, 27] as [number, number, number])))
          const sign = isIngreso ? '+' : '-'
          pdf.text(`${sign}${formatCurrency(r.monto ?? 0)}`, colMonto, y + 5.3, { align: 'right' })

          pdf.setDrawColor(243, 244, 246)
          pdf.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH)

          y += rowH
        })
        y += 8
      }

      // ---------- Footer balance final ----------
      checkPageBreak(20)
      pdf.setFillColor(...lightBg)
      pdf.setDrawColor(...lightBorder)
      pdf.roundedRect(MARGIN, y, CONTENT_W, 16, 2.5, 2.5, 'FD')
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.setTextColor(55, 65, 81)
      pdf.text('BALANCE FINAL', MARGIN + 5, y + 10)
      pdf.setFontSize(14)
      pdf.setTextColor(...mainColor)
      pdf.text(formatCurrency(balance), PAGE_W - MARGIN - 5, y + 10.5, { align: 'right' })

      pdf.save(`${opts.filename}.pdf`)
      return true
    } catch (error) {
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generateExpensePdf, isGenerating }
}