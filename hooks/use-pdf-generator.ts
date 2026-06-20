'use client'

import { useCallback, useState } from 'react'

export function usePdfGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePdf = useCallback(async (elementId: string, filename: string) => {
    setIsGenerating(true)

    try {
      // Wait for DOM to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 200))

      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default

      // Fix: evitar que jsPDF cargue chunks de idioma externos en Next.js
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default

      const element = document.getElementById(elementId)

      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`)
      }

      if (element.offsetWidth === 0 || element.offsetHeight === 0) {
        throw new Error('Element has no visible dimensions')
      }

      // ── Convertir imágenes externas a base64 antes de capturar ──
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
            })
        )
      )

      // Pausa para que el DOM actualice los src
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        removeContainer: true,
        ignoreElements: (el) => {
          return el.tagName === 'LINK' || el.tagName === 'STYLE'
        }
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // putOnlyUsedFonts evita que jsPDF intente cargar fuentes/locales externas
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
      })

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${filename}.pdf`)

      return true
    } catch (error) {
      throw error
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return { generatePdf, isGenerating }
}