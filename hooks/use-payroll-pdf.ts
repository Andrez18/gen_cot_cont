'use client'

import { useCallback, useState } from 'react'
import { buildPayrollPdf, type PayrollPdfData } from '@/lib/payroll-pdf'

interface GenerateOptions {
  /** Muestra el enlace "Generado con CotiFactura" (por defecto sí). */
  branding?: boolean
  /** Nombre del archivo sin extensión; por defecto `Nomina-{number}`. */
  fileName?: string
}

/**
 * Genera y descarga el PDF de la liquidación de nómina.
 *
 * El documento se dibuja con jsPDF (texto real seleccionable), así que
 * aquí solo gestionamos el estado de carga y la descarga del blob.
 */
export function usePayrollPdf() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePayrollPdf = useCallback(
    async (data: PayrollPdfData, options: GenerateOptions = {}): Promise<boolean> => {
      setIsGenerating(true)
      try {
        const pdf = await buildPayrollPdf(data, { branding: options.branding })
        pdf.save(`${options.fileName ?? `Nomina-${data.number}`}.pdf`)
        return true
      } finally {
        setIsGenerating(false)
      }
    },
    [],
  )

  return { generatePayrollPdf, isGenerating }
}
