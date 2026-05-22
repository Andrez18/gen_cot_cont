'use client'

import { useCallback, useState } from 'react'

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 200))

      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default
      const { default: jsPDF } = await import('jspdf')

      const element = document.getElementById(elementId)

      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          // Elimina las variables oklch del root clonado
          const root = clonedDoc.documentElement
          root.style.cssText = ''
          // O más específico:
          const style = clonedDoc.createElement('style')
          style.textContent = `:root { color-scheme: light; }`
          clonedDoc.head.appendChild(style)
        }
      })

      const imgData = canvas.toDataURL('image/jpeg', 1.0)

      // A4
      const pdfWidth = 210
      const pdfHeight = 297

      // Márgenes similares al PDF real
      const margin = 18

      const availableWidth = pdfWidth - margin * 2
      const availableHeight = pdfHeight - margin * 2

      const canvasRatio = canvas.width / canvas.height

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