'use client'

import { useState, useCallback } from 'react'
import { FileText, Receipt, Trash2, Eye, Download, Search, TrendingUp, Clock, ChevronDown, ChevronUp, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Quotation, Invoice } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/document-utils'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { QuotationPreview } from './quotation-preview'
import { InvoicePreview } from './invoice-preview'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useQuotations, useInvoices, useExpenseRecords, useExpenseReports } from '@/hooks/use-supabase-storage'
import { supabase } from '@/lib/supabase'

// ── Mappers snake_case → camelCase ────────────────────────
function mapQuotation(q: any): Quotation {
  return {
    id: q.id,
    number: q.number,
    date: q.date,
    city: q.city,
    client: q.client,
    provider: q.provider,
    items: q.items,
    total: q.total,
    bankInfo: q.bank_info,
    notes: q.notes ?? '',
    legalText: q.legal_text ?? '',
    createdAt: q.created_at,
  }
}

function mapInvoice(i: any): Invoice {
  return {
    id: i.id,
    number: i.number,
    date: i.date,
    city: i.city,
    client: i.client,
    provider: i.provider,
    concept: i.concept,
    amount: i.amount,
    amountInWords: i.amount_in_words,
    bankInfo: i.bank_info,
    createdAt: i.created_at,
  }
}

// ── Fila de registro individual ───────────────────────────
function RegistroRow({ r, onVerFoto }: { r: any; onVerFoto: (url: string) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px',
    }}>
      <span style={{
        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
        background: r.tipo === 'ingreso' ? '#10b981' : '#ef4444', display: 'inline-block',
      }} />
      <span style={{ flex: 1, color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {r.descripcion}
      </span>
      <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '70px', textAlign: 'right' }}>
        {r.cat || '—'}
      </span>
      <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '65px', textAlign: 'right' }}>
        {r.fecha}
      </span>
      {r.foto_url ? (
        <button
          onClick={() => onVerFoto(r.foto_url)}
          title="Ver foto"
          style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6b7280', flexShrink: 0 }}
        >
          <Image size={12} /> foto
        </button>
      ) : (
        <span style={{ width: '46px', flexShrink: 0 }} />
      )}
      <span style={{
        fontWeight: 600, minWidth: '90px', textAlign: 'right', flexShrink: 0,
        color: r.tipo === 'ingreso' ? '#065f46' : '#991b1b',
      }}>
        {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
      </span>
    </div>
  )
}

// ── Informe expandible ────────────────────────────────────
function InformeCard({
  informe, registros, index, enProgreso, onVerFoto,
}: {
  informe: any
  registros?: any[]
  index: number
  enProgreso?: boolean
  onVerFoto: (url: string) => void
}) {
  const [expanded, setExpanded] = useState(enProgreso ?? false)
  const [verRegistros, setVerRegistros] = useState(false)

  const gastosPorCat = informe.gastos_por_cat ?? informe.gastosPorCat ?? {}
  const totalRegistros = informe.total_registros ?? informe.totalRegistros ?? 0

  return (
    <Card className={enProgreso ? 'border-amber-200 bg-amber-50/40' : ''}>
      <CardContent className="p-4">
        {/* Header clickeable */}
        <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
          <div className="flex items-center gap-2">
            {enProgreso
              ? <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              : <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {enProgreso ? 'En progreso' : `Informe #${index}`}
                </span>
                {enProgreso && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Pendiente de cerrar
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {informe.fecha} · {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: informe.balance >= 0 ? '#065f46' : '#991b1b' }}>
              {formatCurrency(informe.balance)}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ingresos', value: informe.ingresos, color: '#065f46', bg: '#f0fdf4' },
                { label: 'Gastos',   value: informe.gastos,   color: '#991b1b', bg: '#fef2f2' },
                { label: 'Balance',  value: informe.balance,  color: informe.balance >= 0 ? '#065f46' : '#991b1b', bg: '#f9fafb' },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: c.color }}>{formatCurrency(c.value)}</div>
                </div>
              ))}
            </div>

            {/* Gastos por categoría */}
            {Object.keys(gastosPorCat).length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Gastos por categoría</div>
                <div className="space-y-1">
                  {Object.entries(gastosPorCat).map(([cat, total]) => (
                    <div key={cat} className="flex justify-between text-sm py-1 border-b border-border/40 last:border-0">
                      <span className="text-muted-foreground">{cat}</span>
                      <span style={{ color: '#991b1b' }}>{formatCurrency(total as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registros individuales */}
            {registros && registros.length > 0 && (
              <div>
                <button
                  onClick={() => setVerRegistros(v => !v)}
                  className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  {verRegistros ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {verRegistros ? 'Ocultar registros' : `Ver ${registros.length} registros`}
                </button>
                {verRegistros && (
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    {registros.map(r => (
                      <RegistroRow key={r.id} r={r} onVerFoto={onVerFoto} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Tab gastos ────────────────────────────────────────────
function GastosTab({ onVerFoto }: { onVerFoto: (url: string) => void }) {
  const { records: registros, isLoaded: regLoaded } = useExpenseRecords()
  const { reports: informes, isLoaded: infLoaded } = useExpenseReports()

  if (!regLoaded || !infLoaded) {
    return <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
  }

  const ingresosPendientes = registros.filter(r => r.tipo === 'ingreso').reduce((a, r) => a + r.monto, 0)
  const gastosPendientes   = registros.filter(r => r.tipo === 'gasto').reduce((a, r) => a + r.monto, 0)
  const gastosPorCatPendientes = registros
    .filter(r => r.tipo === 'gasto')
    .reduce<Record<string, number>>((acc, r) => {
      const k = r.cat || 'Sin categoría'; acc[k] = (acc[k] || 0) + r.monto; return acc
    }, {})

  const informeEnProgreso = registros.length > 0 ? {
    fecha: registros[registros.length - 1]?.fecha ?? '',
    ingresos: ingresosPendientes,
    gastos: gastosPendientes,
    balance: ingresosPendientes - gastosPendientes,
    gastos_por_cat: gastosPorCatPendientes,
    total_registros: registros.length,
  } : null

  if (!informeEnProgreso && informes.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><TrendingUp className="h-6 w-6" /></EmptyMedia>
          <EmptyTitle>Sin registros</EmptyTitle>
          <EmptyDescription>Aún no has registrado gastos ni ingresos</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-3">
      {informeEnProgreso && (
        <InformeCard
          informe={informeEnProgreso}
          registros={registros}
          index={0}
          enProgreso
          onVerFoto={onVerFoto}
        />
      )}
      {informes.length > 0 && (
        <>
          {informeEnProgreso && (
            <div className="text-xs text-muted-foreground uppercase tracking-wide pt-2 pb-1 px-1">
              Informes cerrados
            </div>
          )}
          {informes.map((inf, i) => (
            <InformeCard
              key={inf.id ?? i}
              informe={inf}
              index={informes.length - i}
              onVerFoto={onVerFoto}
            />
          ))}
        </>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export function DocumentHistory() {
  const { quotations, isLoaded: quotationsLoaded } = useQuotations()
  const { invoices, isLoaded: invoicesLoaded } = useInvoices()
  const { generatePdf, isGenerating } = usePdfGenerator()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  const filteredQuotations = quotations.filter(q =>
    q.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.number?.includes(searchTerm)
  )
  const filteredInvoices = invoices.filter(i =>
    i.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.number?.includes(searchTerm)
  )

  const deleteQuotation = useCallback(async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cotización?')) return
    await supabase.from('quotations').delete().eq('id', id)
    window.location.reload()
  }, [])

  const deleteInvoice = useCallback(async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de cobro?')) return
    await supabase.from('invoices').delete().eq('id', id)
    window.location.reload()
  }, [])

  const handleDownloadQuotationPdf = async () => {
    if (!selectedQuotation) return
    try { await generatePdf('quotation-preview', `Cotizacion-${selectedQuotation.number}`) }
    catch { alert('Error al generar el PDF') }
  }

  const handleDownloadInvoicePdf = async () => {
    if (!selectedInvoice) return
    try { await generatePdf('invoice-preview', `CuentaCobro-${selectedInvoice.number}`) }
    catch { alert('Error al generar el PDF') }
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
      <Tabs defaultValue="quotations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quotations" className="gap-2">
            <FileText className="h-4 w-4" />Cotizaciones ({quotations.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt className="h-4 w-4" />Cuentas ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="gastos" className="gap-2">
            <TrendingUp className="h-4 w-4" />Gastos
          </TabsTrigger>
        </TabsList>

        {/* Cotizaciones */}
        <TabsContent value="quotations" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente o número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {filteredQuotations.length === 0 ? (
            <Empty><EmptyHeader>
              <EmptyMedia variant="icon"><FileText className="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>Sin cotizaciones</EmptyTitle>
              <EmptyDescription>{searchTerm ? 'No se encontraron cotizaciones con ese criterio' : 'Aún no has creado ninguna cotización'}</EmptyDescription>
            </EmptyHeader></Empty>
          ) : (
            <div className="grid gap-4">
              {filteredQuotations.map(quotation => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{quotation.number}</span>
                          <span className="text-sm text-muted-foreground">{formatShortDate(quotation.date)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{quotation.client?.companyName}</p>
                        <p className="text-lg font-bold text-primary mt-1">{formatCurrency(quotation.total)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedQuotation(mapQuotation(quotation))}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteQuotation(quotation.id)}>
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

        {/* Cuentas de cobro */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por cliente o número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          {filteredInvoices.length === 0 ? (
            <Empty><EmptyHeader>
              <EmptyMedia variant="icon"><Receipt className="h-6 w-6" /></EmptyMedia>
              <EmptyTitle>Sin cuentas de cobro</EmptyTitle>
              <EmptyDescription>{searchTerm ? 'No se encontraron cuentas con ese criterio' : 'Aún no has creado ninguna cuenta de cobro'}</EmptyDescription>
            </EmptyHeader></Empty>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map(invoice => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">#{invoice.number}</span>
                          <span className="text-sm text-muted-foreground">{formatShortDate(invoice.date)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{invoice.client?.companyName}</p>
                        <p className="text-lg font-bold text-primary mt-1">{formatCurrency(invoice.amount)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(mapInvoice(invoice))}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteInvoice(invoice.id)}>
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

        {/* Gastos */}
        <TabsContent value="gastos" className="mt-6">
          <GastosTab onVerFoto={setFotoUrl} />
        </TabsContent>
      </Tabs>

      {/* Dialog cotización */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cotización #{selectedQuotation?.number}</span>
              <Button size="sm" onClick={handleDownloadQuotationPdf} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />{isGenerating ? 'Generando...' : 'PDF'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedQuotation && <QuotationPreview quotation={selectedQuotation} />}
        </DialogContent>
      </Dialog>

      {/* Dialog cuenta de cobro */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Cuenta de Cobro #{selectedInvoice?.number}</span>
              <Button size="sm" onClick={handleDownloadInvoicePdf} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />{isGenerating ? 'Generando...' : 'PDF'}
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>

      {/* Dialog foto */}
      <Dialog open={!!fotoUrl} onOpenChange={() => setFotoUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto del recibo</DialogTitle>
          </DialogHeader>
          {fotoUrl && (
            <div style={{ textAlign: 'center' }}>
              <img
                src={fotoUrl}
                alt="Recibo"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              />
              <div style={{ marginTop: '12px' }}>
                <a
                  href={fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'underline' }}
                >
                  Abrir en nueva pestaña
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}