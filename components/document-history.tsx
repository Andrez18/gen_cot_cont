'use client'

import { useState } from 'react'
import { FileText, Receipt, Trash2, Eye, Download, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Quotation, Invoice } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/document-utils'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { QuotationPreview } from './quotation-preview'
import { InvoicePreview } from './invoice-preview'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

export function DocumentHistory() {
  const { value: quotations, setValue: setQuotations, isLoaded: quotationsLoaded } = useLocalStorage<Quotation[]>('quotations', [])
  const { value: invoices, setValue: setInvoices, isLoaded: invoicesLoaded } = useLocalStorage<Invoice[]>('invoices', [])
  const { generatePdf, isGenerating } = usePdfGenerator()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const filteredQuotations = quotations.filter(q => 
    q.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.number.includes(searchTerm)
  )

  const filteredInvoices = invoices.filter(i => 
    i.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.number.includes(searchTerm)
  )

  const deleteQuotation = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta cotización?')) {
      setQuotations(quotations.filter(q => q.id !== id))
    }
  }

  const deleteInvoice = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta cuenta de cobro?')) {
      setInvoices(invoices.filter(i => i.id !== id))
    }
  }

  const handleDownloadQuotationPdf = async () => {
    if (!selectedQuotation) return
    try {
      await generatePdf('quotation-preview', `Cotizacion-${selectedQuotation.number}`)
    } catch {
      alert('Error al generar el PDF')
    }
  }

  const handleDownloadInvoicePdf = async () => {
    if (!selectedInvoice) return
    try {
      await generatePdf('invoice-preview', `CuentaCobro-${selectedInvoice.number}`)
    } catch {
      alert('Error al generar el PDF')
    }
  }

  if (!quotationsLoaded || !invoicesLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Cargando historial...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente o número de documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="quotations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quotations" className="gap-2">
            <FileText className="h-4 w-4" />
            Cotizaciones ({quotations.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />
            Cuentas ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations" className="mt-6">
          {filteredQuotations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Sin cotizaciones</EmptyTitle>
                <EmptyDescription>
                  {searchTerm ? "No se encontraron cotizaciones con ese criterio" : "Aún no has creado ninguna cotización"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4">
              {filteredQuotations.map(quotation => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{quotation.number}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatShortDate(quotation.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {quotation.client.companyName}
                        </p>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatCurrency(quotation.total)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedQuotation(quotation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteQuotation(quotation.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          {filteredInvoices.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Receipt className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Sin cuentas de cobro</EmptyTitle>
                <EmptyDescription>
                  {searchTerm ? "No se encontraron cuentas con ese criterio" : "Aún no has creado ninguna cuenta de cobro"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map(invoice => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{invoice.number}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatShortDate(invoice.date)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {invoice.client.companyName}
                        </p>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatCurrency(invoice.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInvoice(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quotation Preview Dialog */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cotización #{selectedQuotation?.number}</span>
              <Button size="sm" onClick={handleDownloadQuotationPdf} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'PDF'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedQuotation && <QuotationPreview quotation={selectedQuotation} />}
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cuenta de Cobro #{selectedInvoice?.number}</span>
              <Button size="sm" onClick={handleDownloadInvoicePdf} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'PDF'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
