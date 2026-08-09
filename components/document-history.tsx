'use client'

import { useState, useCallback } from 'react'
import { FileText, Receipt, Trash2, Eye, Download, Search, TrendingUp, Clock, ChevronDown, ChevronUp, Image, Wrench, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Quotation, Invoice } from '@/lib/types'
import { formatCurrency, formatShortDate } from '@/lib/document-utils'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { useExpensePdfGenerator } from '@/hooks/use-expense-pdf-generator'
import { QuotationPreview } from './quotation-preview'
import { InvoicePreview } from './invoice-preview'
import { ToolsForm } from './tools-form'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useQuotations, useInvoices, useExpenseRecords, useExpenseReports, useTools } from '@/hooks/use-supabase-storage'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/hooks/use_notification'

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

function RegistroRow({ r, onVerFoto }: { r: any; onVerFoto: (url: string) => void }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--muted)', fontSize: '13px' }}>
      {/* Fila principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
          background: r.tipo === 'ingreso' ? 'var(--income-text)' : 'var(--destructive)', display: 'inline-block',
        }} />
        <span style={{ flex: 1, color: 'var(--foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.descripcion}
        </span>
        <span style={{
          fontWeight: 600, flexShrink: 0,
          color: r.tipo === 'ingreso' ? 'var(--income-text)' : 'var(--expense-text)',
        }}>
          {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
        </span>
      </div>
      {/* Fila secundaria: meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', paddingLeft: '15px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{r.cat || '—'}</span>
        <span style={{ fontSize: '11px', color: 'var(--border)' }}>·</span>
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{r.fecha}</span>
        {r.foto_url && (
          <>
            <span style={{ fontSize: '11px', color: 'var(--border)' }}>·</span>
            <button
              onClick={() => onVerFoto(r.foto_url)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--muted-foreground)' }}
            >
              <Image size={11} /> foto
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function InformeCard({
  informe, registros, index, enProgreso, onVerFoto, onVerPdf,
}: {
  informe: any
  registros?: any[]
  index: number
  enProgreso?: boolean
  onVerFoto: (url: string) => void
  onVerPdf: (informe: any, registros: any[], index: number, enProgreso?: boolean) => void
}) {
  const [expanded, setExpanded] = useState(enProgreso ?? false)
  const [verRegistros, setVerRegistros] = useState(false)

  const gastosPorCat = informe.gastos_por_cat ?? informe.gastosPorCat ?? {}
  const totalRegistros = informe.total_registros ?? informe.totalRegistros ?? 0

  return (
    <Card className={enProgreso ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20' : ''}>
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
                  <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                    Pendiente de cerrar
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {informe.fecha} · {totalRegistros} registro{totalRegistros !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: informe.balance >= 0 ? 'var(--income-text)' : 'var(--expense-text)' }}>
              {formatCurrency(informe.balance)}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-7 text-xs px-2"
              onClick={e => { e.stopPropagation(); onVerPdf(informe, registros ?? [], index, enProgreso) }}
            >
              <Eye size={12} />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Ingresos', value: informe.ingresos, color: 'var(--income-text)', bg: 'var(--income-bg)' },
                { label: 'Gastos',   value: informe.gastos,   color: 'var(--expense-text)', bg: 'var(--expense-bg)' },
                { label: 'Balance',  value: informe.balance,  color: informe.balance >= 0 ? 'var(--income-text)' : 'var(--expense-text)', bg: 'var(--muted)' },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: '6px', padding: '8px 10px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: c.color }}>{formatCurrency(c.value)}</div>
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
                      <span style={{ color: 'var(--expense-text)' }}>{formatCurrency(total as number)}</span>
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
                  <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
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

function GastosTab({ onVerFoto, onVerPdf }: { onVerFoto: (url: string) => void; onVerPdf: (informe: any, registros: any[], index: number, enProgreso?: boolean) => void }) {
  const { records: registros, isLoaded: regLoaded } = useExpenseRecords()
  const { reports: informes, isLoaded: infLoaded, hasMore, isLoadingMore, loadMore } = useExpenseReports()

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
          onVerPdf={onVerPdf}
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
              registros={inf.expense_records ?? []} 
              index={informes.length - i}
              onVerFoto={onVerFoto}
              onVerPdf={onVerPdf}
            />
          ))}
        </>
      )}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando...' : 'Cargar más informes'}
          </Button>
        </div>
      )}
    </div>
  )
}

function HerramientasTab({
  onVerPdf,
}: {
  onVerPdf: (tools: any[], total: number, obraName?: string) => void
}) {
  const { tools, isLoaded, hasMore, isLoadingMore, loadMore } = useTools()
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  if (!isLoaded) {
    return <div className="py-8 text-center text-muted-foreground text-sm animate-pulse">Cargando...</div>
  }

  if (tools.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon"><Wrench className="h-6 w-6" /></EmptyMedia>
          <EmptyTitle>Sin herramientas</EmptyTitle>
          <EmptyDescription>Aún no has registrado herramientas en ninguna obra</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // Agrupar por obra_nombre (null → "Sin obra")
  const grupos = tools
    .filter(t => !searchTerm || t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
    .reduce<Record<string, any[]>>((acc, t) => {
      const key = t.obra_nombre?.trim() || 'Sin obra'
      if (!acc[key]) acc[key] = []
      acc[key].push(t)
      return acc
    }, {})

  const toggleGroup = (key: string) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar herramienta..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {Object.keys(grupos).length === 0 ? (
        <p className="text-sm text-center text-muted-foreground py-6">No se encontraron herramientas con ese criterio</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(grupos).map(([obraKey, obraTools]) => {
            const obraTotal = obraTools.reduce((s, t) => s + (t.total_calculado ?? 0), 0)
            const isCollapsed = collapsed[obraKey] ?? false
            const sinObra = obraKey === 'Sin obra'

            return (
              <div key={obraKey} className="rounded-xl border border-border overflow-hidden">
                {/* Header del grupo */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                  onClick={() => toggleGroup(obraKey)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Building2 size={14} className={`shrink-0 ${sinObra ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-semibold truncate ${sinObra ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                      {obraKey}
                    </span>
                    <span className="text-xs text-muted-foreground bg-background border border-border rounded-full px-2 py-0.5 shrink-0 hidden sm:inline">
                      {obraTools.length} herramienta{obraTools.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-foreground">{formatCurrency(obraTotal)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-7 text-xs px-2"
                      onClick={e => { e.stopPropagation(); onVerPdf(obraTools, obraTotal, sinObra ? undefined : obraKey) }}
                    >
                      <Eye size={12} />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                    {isCollapsed
                      ? <ChevronDown size={15} className="text-muted-foreground" />
                      : <ChevronUp size={15} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Filas de herramientas */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {obraTools.map(tool => (
                      <div key={tool.id} className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted/20 transition-colors">
                        <div className="size-7 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0">
                          <Wrench size={13} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{tool.nombre}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tool.precio_dia != null
                              ? `${formatCurrency(tool.precio_dia)}/día × ${tool.dias_usados ?? 0} días`
                              : 'Precio fijo'}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground shrink-0">
                          {formatCurrency(tool.total_calculado ?? 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {!searchTerm && hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Cargando...' : 'Cargar más herramientas'}
          </Button>
        </div>
      )}
    </div>
  )
}

export function DocumentHistory() {
  const { quotations, isLoaded: quotationsLoaded, hasMore: hasMoreQuotations, isLoadingMore: isLoadingMoreQuotations, loadMore: loadMoreQuotations } = useQuotations()
  const { invoices, isLoaded: invoicesLoaded, hasMore: hasMoreInvoices, isLoadingMore: isLoadingMoreInvoices, loadMore: loadMoreInvoices } = useInvoices()
  const { generatePdf, isGenerating } = usePdfGenerator()
  const { generateExpensePdf, isGenerating: isGeneratingInforme, imageProgress } = useExpensePdfGenerator()
  const { success, error: notifError, warning } = useNotification()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [toolsPdfData, setToolsPdfData] = useState<{ tools: any[]; total: number; obraName?: string } | null>(null)
  const [informePdfData, setInformePdfData] = useState<{ informe: any; registros: any[]; index: number; enProgreso?: boolean } | null>(null)

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
    const { error } = await supabase.from('quotations').delete().eq('id', id)
    if (error) {
      notifError('Error al eliminar', error.message)
      return
    }
    success('Cotización eliminada')
    window.location.reload()
  }, [success, notifError])

  const deleteInvoice = useCallback(async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de cobro?')) return
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) {
      notifError('Error al eliminar', error.message)
      return
    }
    success('Cuenta de cobro eliminada')
    window.location.reload()
  }, [success, notifError])

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

  const handleDownloadToolsPdf = async () => {
    try { await generatePdf('tools-pdf-dialog-preview', 'herramientas') }
    catch { alert('Error al generar el PDF') }
  }

  const handleDownloadInformePdf = async () => {
    if (!informePdfData) return
    const nombre = informePdfData.enProgreso ? 'Informe-en-progreso' : `Informe-gastos-${informePdfData.index}`
    try {
      await generateExpensePdf(informePdfData.informe, informePdfData.registros ?? [], {
        index: informePdfData.index,
        enProgreso: informePdfData.enProgreso,
        filename: nombre,
      })
    } catch { alert('Error al generar el PDF') }
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quotations" className="gap-1.5">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Cotizaciones ({quotations.length})</span>
            <span className="sm:hidden text-xs">Cotiz.</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5">
            <Receipt className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Cuentas ({invoices.length})</span>
            <span className="sm:hidden text-xs">Cuentas</span>
          </TabsTrigger>
          <TabsTrigger value="gastos" className="gap-1.5">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Gastos</span>
            <span className="sm:hidden text-xs">Gastos</span>
          </TabsTrigger>
          <TabsTrigger value="herramientas" className="gap-1.5">
            <Wrench className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Herramientas</span>
            <span className="sm:hidden text-xs">Tools</span>
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
            <div className="grid gap-3">
              {filteredQuotations.map(quotation => (
                <Card key={quotation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">#{quotation.number}</span>
                          <span className="text-xs text-muted-foreground">{formatShortDate(quotation.date)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{quotation.client?.companyName}</p>
                        <p className="text-base font-bold text-primary mt-1">{formatCurrency(quotation.total)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedQuotation(mapQuotation(quotation))}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteQuotation(quotation.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!searchTerm && hasMoreQuotations && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMoreQuotations} disabled={isLoadingMoreQuotations}>
                {isLoadingMoreQuotations ? 'Cargando...' : 'Cargar más'}
              </Button>
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
            <div className="grid gap-3">
              {filteredInvoices.map(invoice => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm">#{invoice.number}</span>
                          <span className="text-xs text-muted-foreground">{formatShortDate(invoice.date)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{invoice.client?.companyName}</p>
                        <p className="text-base font-bold text-primary mt-1">{formatCurrency(invoice.amount)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInvoice(mapInvoice(invoice))}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteInvoice(invoice.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!searchTerm && hasMoreInvoices && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={loadMoreInvoices} disabled={isLoadingMoreInvoices}>
                {isLoadingMoreInvoices ? 'Cargando...' : 'Cargar más'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Gastos */}
        <TabsContent value="gastos" className="mt-6">
          <GastosTab
            onVerFoto={setFotoUrl}
            onVerPdf={(informe, registros, index, enProgreso) => setInformePdfData({ informe, registros, index, enProgreso })}
          />
        </TabsContent>

        {/* Herramientas */}
        <TabsContent value="herramientas" className="mt-4">
          <HerramientasTab
            onVerPdf={(tools, total, obraName) => setToolsPdfData({ tools, total, obraName })}
          />
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
                crossOrigin='anonymous'
                alt="Recibo"
                style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ marginTop: '12px' }}>
                <a
                  href={fotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '13px', color: 'var(--muted-foreground)', textDecoration: 'underline' }}
                >
                  Abrir en nueva pestaña
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog vista previa herramientas PDF */}
      <Dialog open={!!toolsPdfData} onOpenChange={() => setToolsPdfData(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header del dialog */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                <Wrench size={16} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight truncate">Vista previa — Herramientas</h2>
                {toolsPdfData?.obraName && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Building2 size={11} className="text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">{toolsPdfData.obraName}</span>
                  </div>
                )}
              </div>
            </div>
            <Button size="sm" className="gap-2 shrink-0 ml-3" onClick={handleDownloadToolsPdf} disabled={isGenerating}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isGenerating ? 'Generando...' : 'Descargar PDF'}</span>
              <span className="sm:hidden">{isGenerating ? '...' : 'PDF'}</span>
            </Button>
          </div>

          {/* Contenido scrollable */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {toolsPdfData && (
              <div
                id="tools-pdf-dialog-preview"
                style={{
                  background: '#fff',
                  padding: '36px 40px',
                  fontFamily: 'Arial, sans-serif',
                  color: '#111',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                {/* Header PDF */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#111' }}>
                        Lista de Herramientas
                      </h1>
                      {toolsPdfData.obraName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <div style={{ width: 3, height: 16, background: '#111', borderRadius: 2 }} />
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{toolsPdfData.obraName}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: '#888', margin: '6px 0 0' }}>
                        {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Total</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{formatCurrency(toolsPdfData.total)}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{toolsPdfData.tools.length} herramienta{toolsPdfData.tools.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ height: 2, background: '#111', borderRadius: 1, marginTop: 18 }} />
                </div>

                {/* Encabezado tabla */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 60px 110px', gap: 0, paddingBottom: 8, marginBottom: 2 }}>
                  {['Herramienta', 'Precio / día', 'Días', 'Total'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                  ))}
                </div>

                {/* Filas */}
                {toolsPdfData.tools.map((tool, i) => (
                  <div
                    key={tool.id ?? i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 130px 60px 110px',
                      padding: '10px 10px',
                      borderRadius: 6,
                      background: i % 2 === 0 ? '#f9fafb' : '#fff',
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{tool.nombre}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {tool.precio_dia != null ? formatCurrency(tool.precio_dia) : '—'}
                    </span>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {tool.dias_usados != null ? tool.dias_usados : tool.precio_total != null ? 'Fijo' : '—'}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{formatCurrency(tool.total_calculado ?? 0)}</span>
                  </div>
                ))}

                {/* Total footer */}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '2px solid #111', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total herramientas</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#111' }}>{formatCurrency(toolsPdfData.total)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog vista previa informe de gastos PDF */}
      <Dialog open={!!informePdfData} onOpenChange={() => setInformePdfData(null)}>
        <DialogContent className="w-full max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Header del dialog */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-tight truncate">
                  {informePdfData?.enProgreso ? 'Informe en progreso' : `Informe #${informePdfData?.index}`}
                </h2>
                {informePdfData?.informe?.fecha && (
                  <span className="text-xs text-muted-foreground">{informePdfData.informe.fecha}</span>
                )}
              </div>
            </div>
            <Button size="sm" className="gap-2 shrink-0 ml-3" onClick={handleDownloadInformePdf} disabled={isGeneratingInforme}>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {imageProgress
                  ? `Cargando fotos (${imageProgress.loaded}/${imageProgress.total})...`
                  : isGeneratingInforme ? 'Generando...' : 'Descargar PDF'}
              </span>
              <span className="sm:hidden">
                {imageProgress ? `${imageProgress.loaded}/${imageProgress.total}` : isGeneratingInforme ? '...' : 'PDF'}
              </span>
            </Button>
          </div>

          {/* Contenido scrollable */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {informePdfData && (() => {
              const inf = informePdfData.informe
              const regs = informePdfData.registros ?? []
              const gastosPorCat = inf.gastos_por_cat ?? inf.gastosPorCat ?? {}
              return (
                <div
                  id="informe-pdf-dialog-preview"
                  style={{
                    background: '#ffffff',
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    color: '#111827',
                    borderRadius: '14px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Banda superior de color */}
                  <div
                    style={{
                      background: inf.balance >= 0
                        ? 'linear-gradient(135deg, #064e3b 0%, #047857 100%)'
                        : 'linear-gradient(135deg, #450a0a 0%, #b91c1c 100%)',
                      padding: '28px 40px',
                      color: '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span style={{ fontSize: 15 }}>📊</span>
                          </div>
                          <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                            Informe de Gastos e Ingresos
                          </h1>
                        </div>
                        <span style={{
                          display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px',
                          borderRadius: 999, background: 'rgba(255,255,255,0.18)', letterSpacing: '0.03em',
                        }}>
                          {informePdfData.enProgreso ? 'EN PROGRESO' : `INFORME #${informePdfData.index}`}
                        </span>
                        <p style={{ fontSize: 12, opacity: 0.85, margin: '10px 0 0' }}>
                          {inf.fecha ?? new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                          Balance final
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                          {formatCurrency(inf.balance)}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 6 }}>
                          {(inf.total_registros ?? inf.totalRegistros ?? regs.length)} registro{(inf.total_registros ?? inf.totalRegistros ?? regs.length) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '28px 40px 36px' }}>
                    {/* Tarjetas resumen */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
                      {[
                        { label: 'Ingresos', value: inf.ingresos, color: '#065f46', bg: '#f0fdf4', border: '#bbf7d0', icon: '↑' },
                        { label: 'Gastos', value: inf.gastos, color: '#991b1b', bg: '#fef2f2', border: '#fecaca', icon: '↓' },
                        { label: 'Balance', value: inf.balance, color: inf.balance >= 0 ? '#065f46' : '#991b1b', bg: inf.balance >= 0 ? '#f0fdf4' : '#fef2f2', border: inf.balance >= 0 ? '#bbf7d0' : '#fecaca', icon: '=' },
                      ].map(c => (
                        <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '14px 16px', border: `1px solid ${c.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: c.color }}>{c.icon}</span>
                            <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{c.label}</span>
                          </div>
                          <div style={{ fontSize: 17, fontWeight: 800, color: c.color }}>{formatCurrency(c.value)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Gastos por categoría */}
                    {Object.keys(gastosPorCat).length > 0 && (() => {
                      const maxCat = Math.max(...Object.values(gastosPorCat).map(v => v as number), 1)
                      return (
                        <div style={{ marginBottom: 28 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 3, height: 13, background: '#991b1b', borderRadius: 2, display: 'inline-block' }} />
                            Gastos por categoría
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Object.entries(gastosPorCat).map(([cat, total]) => {
                              const pct = Math.round(((total as number) / maxCat) * 100)
                              return (
                                <div key={cat}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 600 }}>{cat}</span>
                                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#991b1b' }}>{formatCurrency(total as number)}</span>
                                  </div>
                                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #f87171, #b91c1c)', borderRadius: 999 }} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Detalle de registros */}
                    {regs.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 3, height: 13, background: '#111827', borderRadius: 2, display: 'inline-block' }} />
                          Detalle de registros
                        </div>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{
                            display: 'grid', gridTemplateColumns: '1fr 110px 90px 100px', gap: 0,
                            padding: '9px 14px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
                          }}>
                            {['Descripción', 'Categoría', 'Fecha', 'Monto'].map(h => (
                              <span key={h} style={{ fontSize: 10, fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                            ))}
                          </div>
                          {regs.map((r, i) => (
                            <div
                              key={r.id ?? i}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 110px 90px 100px',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: i % 2 === 0 ? '#ffffff' : '#fafafa',
                                borderBottom: i === regs.length - 1 ? 'none' : '1px solid #f3f4f6',
                                fontSize: 12.5,
                              }}
                            >
                              <span style={{ color: '#111827', fontWeight: 600 }}>{r.descripcion}</span>
                              <span style={{ color: '#6b7280' }}>{r.cat || '—'}</span>
                              <span style={{ color: '#6b7280' }}>{r.fecha}</span>
                              <span style={{
                                fontWeight: 700,
                                color: r.tipo === 'ingreso' ? '#065f46' : '#991b1b',
                                display: 'flex', alignItems: 'center', gap: 4,
                              }}>
                                <span style={{ fontSize: 10 }}>{r.tipo === 'ingreso' ? '↑' : '↓'}</span>
                                {formatCurrency(r.monto)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total footer */}
                    <div style={{
                      marginTop: 24, padding: '16px 20px', borderRadius: 10,
                      background: inf.balance >= 0 ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${inf.balance >= 0 ? '#bbf7d0' : '#fecaca'}`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Balance final
                      </span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: inf.balance >= 0 ? '#065f46' : '#991b1b' }}>
                        {formatCurrency(inf.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}