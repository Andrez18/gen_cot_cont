'use client'

import { useCallback, useState } from 'react'

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)

    try {
      console.log('[v0] Step 1: Starting PDF generation')

      // Wait for DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 200))

      console.log('[v0] Step 2: Importing libraries')

      // Dynamic imports to avoid SSR issues
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default
      const { default: jsPDF } = await import('jspdf')

      console.log('[v0] Step 3: Finding element:', elementId)

      const element = document.getElementById(elementId)

      if (!element) {
        console.error('[v0] Element not found:', elementId)
        throw new Error(`Element with id "${elementId}" not found`)
      }

      console.log(
        '[v0] Step 4: Element dimensions:',
        element.offsetWidth,
        'x',
        element.offsetHeight
      )

      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error('Element has no visible dimensions')
      }

      console.log('[v0] Step 5: Creating canvas with html2canvas')

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
        foreignObjectRendering: false,
        removeContainer: true,
        ignoreElements: (el) => {
          return el.tagName === 'LINK' || el.tagName === 'STYLE'
        }
      })

      console.log(
        '[v0] Step 6: Canvas created:',
        canvas.width,
        'x',
        canvas.height
      )

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      console.log('[v0] Step 7: Image data length:', imgData.length)

      // Tamaño A4 en mm
      const pdfWidth = 210
      const pdfHeight = 297

      // Relación del canvas
      const canvasRatio = canvas.height / canvas.width

      // Ajustar imagen para que quepa en UNA sola hoja
      let imgWidth = pdfWidth
      let imgHeight = imgWidth * canvasRatio

      // Si la altura supera el tamaño de la hoja,
      // reducir proporcionalmente
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight
        imgWidth = imgHeight / canvasRatio
      }

      // Centrar contenido
      const x = (pdfWidth - imgWidth) / 2
      const y = (pdfHeight - imgHeight) / 2

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      })

      // Agregar SOLO una página
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight)

      pdf.save(`${filename}.pdf`)

      return true
    } catch (error) {
      console.error('[v0] PDF generation error:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generatePdf, isGenerating }
}