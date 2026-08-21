'use client'

import { useCallback, useState } from 'react'

const PAGE_WIDTH_MM = 210
const PAGE_HEIGHT_MM = 297

/* =========================================================
   Utilidades internas compartidas por ambos modos de PDF
========================================================= */

async function loadLibs() {
  const html2canvasModule = await import('html2canvas')
  const html2canvas = html2canvasModule.default
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default
  return { html2canvas, jsPDF }
}

function findElement(elementId: string): HTMLElement {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`)
  }
  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
    throw new Error('Element has no visible dimensions')
  }
  return element
}

/** Convierte todas las <img> a dataURL para evitar taint de CORS al capturar. */
async function inlineImages(element: HTMLElement) {
  const images = element.querySelectorAll('img')
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (!img.src || img.src.startsWith('data:')) {
            resolve()
            return
          }

          fetch(img.src)
            .then((res) => res.blob())
            .then((blob) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                img.src = reader.result as string
                resolve()
              }
              reader.onerror = () => resolve()
              reader.readAsDataURL(blob)
            })
            .catch(() => resolve())
        }),
    ),
  )
}

async function captureCanvas(
  element: HTMLElement,
  html2canvas: typeof import('html2canvas').default,
): Promise<HTMLCanvasElement> {
  await new Promise(resolve => setTimeout(resolve, 100))

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    foreignObjectRendering: false,
    removeContainer: true,
    ignoreElements: (el) => {
      return el.tagName === 'LINK' || el.tagName === 'STYLE'
    },
  })
}

/**
 * Calcula los rangos verticales (en px CSS) de cada página de forma que
 * ningún bloque marcado con [data-pdf-block] quede cortado entre páginas:
 * si un bloque no cabe completo en lo que queda de página, salta entero
 * a la siguiente (como break-inside: avoid).
 */
function computePageRanges(element: HTMLElement): Array<[number, number]> {
  // Capacidad vertical de una página A4 escalada al ancho del elemento.
  const capacity = element.offsetWidth * (PAGE_HEIGHT_MM / PAGE_WIDTH_MM)

  const elRect = element.getBoundingClientRect()
  const blocks = Array.from(element.querySelectorAll<HTMLElement>('[data-pdf-block]'))
    .map(block => {
      const r = block.getBoundingClientRect()
      return { top: r.top - elRect.top, height: r.height }
    })
    .filter(b => b.height > 0 && b.top >= 0)
    .sort((a, b) => a.top - b.top)

  const ranges: Array<[number, number]> = []
  let start = 0
  for (const b of blocks) {
    const bottom = b.top + b.height
    // Si el bloque no cabe completo y él solo sí cabe en una página,
    // cierra la página actual justo antes del bloque.
    if (bottom - start > capacity && b.height <= capacity && b.top > start) {
      ranges.push([start, b.top])
      start = b.top
    }
  }
  ranges.push([start, Math.max(element.scrollHeight, start + 1)])
  return ranges
}

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  /* ── Modo clásico: captura continua y corte equidistante (legacy) ── */
  const buildPdf = useCallback(async (elementId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))

    const { html2canvas, jsPDF } = await loadLibs()
    const element = findElement(elementId)
    await inlineImages(element)

    const canvas = await captureCanvas(element, html2canvas)

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const imgWidth = PAGE_WIDTH_MM
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    })

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= PAGE_HEIGHT_MM

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= PAGE_HEIGHT_MM
    }

    return pdf
  }, [])

  /* ── Modo sin cortes: cada bloque completo pasa a la página siguiente ── */
  const buildPdfNoBreak = useCallback(async (elementId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200))

    const { html2canvas, jsPDF } = await loadLibs()
    const element = findElement(elementId)
    await inlineImages(element)

    const canvas = await captureCanvas(element, html2canvas)

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    })

    const pxToMm = PAGE_WIDTH_MM / element.offsetWidth
    const scale = canvas.width / element.offsetWidth
    const ranges = computePageRanges(element)

    ranges.forEach(([startPx, endPx], index) => {
      const sy = Math.floor(startPx * scale)
      const sliceHeight = Math.max(1, Math.ceil((endPx - startPx) * scale))

      const page = document.createElement('canvas')
      page.width = canvas.width
      page.height = sliceHeight
      const ctx = page.getContext('2d')
      if (!ctx) throw new Error('No se pudo preparar la página del PDF')

      // Fondo blanco y recorte del lienzo completo en la posición del bloque
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, page.width, page.height)
      ctx.drawImage(canvas, 0, -sy)

      const imgData = page.toDataURL('image/jpeg', 0.95)
      if (index > 0) pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, (endPx - startPx) * pxToMm)
    })

    return pdf
  }, [])

  const generatePdf = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)
    try {
      const pdf = await buildPdf(elementId)
      pdf.save(`${filename}.pdf`)
      return true
    } catch (error) {
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [buildPdf])

  /** Descarga el PDF moviendo bloques completos a la página siguiente sin cortarlos. */
  const generatePdfNoBreak = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)
    try {
      const pdf = await buildPdfNoBreak(elementId)
      pdf.save(`${filename}.pdf`)
      return true
    } catch (error) {
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [buildPdfNoBreak])

  const generatePdfBlob = useCallback(async (elementId: string): Promise<Blob> => {
    setIsGenerating(true)
    try {
      const pdf = await buildPdf(elementId)
      return pdf.output('blob')
    } catch (error) {
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [buildPdf])

  return { generatePdf, generatePdfNoBreak, generatePdfBlob, isGenerating }
}
