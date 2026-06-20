'use client'

import { useCallback, useState } from 'react'
import { formatCurrency } from '@/lib/document-utils'
import { supabase } from '@/lib/supabase'

async function resolveImageUrl(url: string): Promise<string | null> {
  let bucket: string
  let path: string

  if (url.startsWith('supabase-storage://')) {
    const rest = url.slice('supabase-storage://'.length)
    const slashIdx = rest.indexOf('/')
    if (slashIdx === -1) return null
    bucket = rest.slice(0, slashIdx)
    path = rest.slice(slashIdx + 1)
  } else {
    try {
      const u = new URL(url)
      const m = u.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/)
      if (!m) return null
      bucket = m[1]
      path = m[2]
    } catch {
      return null
    }
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 120)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

interface Registro {
  id?: string
  descripcion?: string
  cat?: string
  fecha?: string
  monto?: number
  tipo?: 'ingreso' | 'gasto'
  foto_url?: string
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

interface LoadedImage {
  dataUrl: string   // dataUrl ya redimensionado, listo para jsPDF
  width: number     // ancho original (para calcular ratio)
  height: number    // alto original
  format: 'JPEG' | 'PNG'
}

// Máxima dimensión en píxeles que se pasará a jsPDF.
// jsPDF falla silenciosamente con imágenes demasiado grandes.
const MAX_IMG_PX = 1200

async function loadImageAsDataUrl(url: string, timeoutMs = 15000): Promise<LoadedImage | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null

    const format: 'JPEG' | 'PNG' = blob.type.includes('png') ? 'PNG' : 'JPEG'

    // Cargar en un elemento Image para obtener dimensiones reales
    const originalDataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    const { naturalWidth, naturalHeight } = await new Promise<{ naturalWidth: number; naturalHeight: number }>(
      (resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve({ naturalWidth: img.naturalWidth || 1, naturalHeight: img.naturalHeight || 1 })
        img.onerror = reject
        img.src = originalDataUrl
      }
    )

    // Si la imagen cabe dentro del límite, devolverla tal cual
    if (naturalWidth <= MAX_IMG_PX && naturalHeight <= MAX_IMG_PX) {
      return { dataUrl: originalDataUrl, width: naturalWidth, height: naturalHeight, format }
    }

    // Redimensionar mediante canvas para que jsPDF no falle
    const scale = MAX_IMG_PX / Math.max(naturalWidth, naturalHeight)
    const targetW = Math.round(naturalWidth * scale)
    const targetH = Math.round(naturalHeight * scale)

    const resizedDataUrl: string = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('no canvas context')); return }
        ctx.drawImage(img, 0, 0, targetW, targetH)
        resolve(canvas.toDataURL('image/jpeg', 0.88))
      }
      img.onerror = reject
      img.src = originalDataUrl
    })

    return { dataUrl: resizedDataUrl, width: naturalWidth, height: naturalHeight, format: 'JPEG' }
  } catch {
    return null
  }
}

export function useExpensePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [imageProgress, setImageProgress] = useState<{ loaded: number; total: number } | null>(null)

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

      const urlsUnicas = Array.from(new Set(registros.map(r => r.foto_url).filter((u): u is string => !!u)))
      const imagenes = new Map<string, LoadedImage>()
      if (urlsUnicas.length > 0) {
        setImageProgress({ loaded: 0, total: urlsUnicas.length })
        let loaded = 0
        const resultados = await Promise.allSettled(
          urlsUnicas.map(async (u) => {
            const signedUrl = await resolveImageUrl(u)
            if (!signedUrl) { loaded++; setImageProgress({ loaded, total: urlsUnicas.length }); return null }
            const img = await loadImageAsDataUrl(signedUrl)
            loaded++
            setImageProgress({ loaded, total: urlsUnicas.length })
            return img
          })
        )
        urlsUnicas.forEach((u, i) => {
          const r = resultados[i]
          if (r.status === 'fulfilled' && r.value) imagenes.set(u, r.value)
        })
        setImageProgress(null)
      }

      const isPositive = balance >= 0
      const mainColor: [number, number, number] = isPositive ? [6, 95, 70] : [153, 27, 27]
      const mainColorDark: [number, number, number] = isPositive ? [4, 78, 56] : [69, 10, 10]
      const lightBg: [number, number, number] = isPositive ? [240, 253, 244] : [254, 242, 242]
      const lightBorder: [number, number, number] = isPositive ? [187, 247, 208] : [254, 202, 202]

      let y = 0

      const headerH = 42
      pdf.setFillColor(...mainColorDark)
      pdf.rect(0, 0, PAGE_W, headerH, 'F')
      pdf.setFillColor(...mainColor)
      pdf.rect(0, 0, PAGE_W, headerH * 0.6, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(16)
      pdf.text('Informe de Gastos e Ingresos', MARGIN, 16)

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

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('BALANCE FINAL', PAGE_W - MARGIN, 14, { align: 'right' })
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(18)
      pdf.text(formatCurrency(balance), PAGE_W - MARGIN, 23, { align: 'right' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.text(`${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''}`, PAGE_W - MARGIN, 29, { align: 'right' })

      y = headerH + 12

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
          const img = r.foto_url ? imagenes.get(r.foto_url) : undefined
          const IMG_MAX_W = 32
          const IMG_MAX_H = 24
          let imgW = 0
          let imgH = 0
          if (img) {
            const ratio = img.width / img.height
            imgW = IMG_MAX_W
            imgH = imgW / ratio
            if (imgH > IMG_MAX_H) {
              imgH = IMG_MAX_H
              imgW = imgH * ratio
            }
          }
          const baseRowH = 8
          const rowH = img ? baseRowH + imgH + 5 : baseRowH

          checkPageBreak(rowH + 2)
          if (y === MARGIN) drawTableHeader()

          pdf.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250)
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
          pdf.text(`${isIngreso ? '+' : '-'}${formatCurrency(r.monto ?? 0)}`, colMonto, y + 5.3, { align: 'right' })

          if (img) {
            const imgX = colDesc + 2
            const imgY = y + baseRowH + 1
            pdf.setDrawColor(229, 231, 235)
            pdf.setLineWidth(0.2)
            pdf.rect(imgX - 0.5, imgY - 0.5, imgW + 1, imgH + 1)
            pdf.addImage(img.dataUrl, 'JPEG', imgX, imgY, imgW, imgH)
          }

          pdf.setDrawColor(243, 244, 246)
          pdf.line(MARGIN, y + rowH, PAGE_W - MARGIN, y + rowH)
          y += rowH
        })
        y += 8
      }

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
      setImageProgress(null)
    }
  }, [])

  return { generateExpensePdf, isGenerating, imageProgress }
}