'use client'

import { useCallback, useState } from 'react'

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 200))

      // html-to-image soporta oklch() y CSS moderno, a diferencia de html2canvas
      const { toJpeg } = await import('html-to-image')
      const { default: jsPDF } = await import('jspdf')

      const element = document.getElementById(elementId)

      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      const imgData = await toJpeg(element, {
        quality: 1.0,
        backgroundColor: '#ffffff',
        // Captura el elemento a doble resolución para mayor nitidez
        pixelRatio: 2,
      })

      // A4
      const pdfWidth = 210
      const pdfHeight = 297

      // Márgenes similares al PDF real
      const margin = 18

      const availableWidth = pdfWidth - margin * 2
      const availableHeight = pdfHeight - margin * 2

      // Calculamos el ratio desde el elemento real del DOM
      const canvasRatio = element.offsetWidth / element.offsetHeight

      let imgWidth = availableWidth
      let imgHeight = imgWidth / canvasRatio

      // Ajustar altura para que SIEMPRE quede en una sola hoja
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight
        imgWidth = imgHeight * canvasRatio
      }

      // Centrado
      const x = (pdfWidth - imgWidth) / 2
      const y = (pdfHeight - imgHeight) / 2

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      })

      pdf.addImage(
        imgData,
        'JPEG',
        x,
        y,
        imgWidth,
        imgHeight
      )

      pdf.save(`${filename}.pdf`)

      return true
    } catch (error) {
      console.error('PDF generation error:', error)
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generatePdf, isGenerating }
}