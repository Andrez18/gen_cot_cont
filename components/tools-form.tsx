'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FileDown, Wrench, Pencil, Check, X, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/header'
import { useTools, type Tool } from '@/hooks/use-supabase-storage'
import { useNotification } from '@/hooks/use_notification'
import { formatCurrency } from '@/lib/document-utils'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'

type PricingMode = 'total' | 'daily'

interface ToolDraft {
  nombre: string
  pricingMode: PricingMode
  precio_dia: string
  dias_usados: string
  precio_total: string
}

const emptyDraft = (): ToolDraft => ({
  nombre: '',
  pricingMode: 'daily',
  precio_dia: '',
  dias_usados: '',
  precio_total: '',
})

function calcTotal(draft: ToolDraft): number {
  if (draft.pricingMode === 'total') {
    return Number(draft.precio_total) || 0
  }
  return (Number(draft.precio_dia) || 0) * (Number(draft.dias_usados) || 0)
}

const inputStyle = 'border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full'

export function ToolsForm() {
  const { success, error: notifError, loading, dismiss, info } = useNotification()
  const { generatePdf, isGenerating } = usePdfGenerator()
  const router = useRouter()

  // ── obra name modal ───────────────────────────────────────────────────────
  const SESSION_KEY = 'tools_obra_activa'
  const savedObra = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) ?? '' : ''
  const [obraName, setObraName] = useState<string>(savedObra)
  const [obraInput, setObraInput] = useState<string>(savedObra)
  const [showModal, setShowModal] = useState(!savedObra)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingObra, setEditingObra] = useState(false)
  const obraInputRef = useRef<HTMLInputElement>(null)

  const { tools, addTool, deleteTool, updateTool, isLoaded } = useTools(obraName || null)

  const [draft, setDraft] = useState<ToolDraft>(emptyDraft())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<ToolDraft>(emptyDraft())
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!showModal) return
    // pequeño delay para que la animación de entrada sea perceptible
    const t = setTimeout(() => setModalVisible(true), 50)
    return () => clearTimeout(t)
  }, [showModal])

  useEffect(() => {
    if (showModal && modalVisible) {
      setTimeout(() => obraInputRef.current?.focus(), 100)
    }
  }, [showModal, modalVisible])

  const handleConfirmObra = () => {
    const trimmed = obraInput.trim()
    if (!trimmed) return
    setObraName(trimmed)
    sessionStorage.setItem(SESSION_KEY, trimmed)
    setModalVisible(false)
    setTimeout(() => setShowModal(false), 250)
  }

  const handleFinishObra = () => {
    setShowConfirm(true)
  }

  const handleConfirmNuevaObra = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setObraName('')
    setObraInput('')
    setShowConfirm(false)
    setShowModal(true)
    setModalVisible(false)
    setTimeout(() => setModalVisible(true), 50)
  }

  const handleConfirmSalir = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setShowConfirm(false)
    info('Herramientas guardadas', 'Hasta luego 👋')
    setTimeout(() => router.push('/'), 1200)
  }

  const handleObraKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmObra()
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  const setField = (field: keyof ToolDraft, value: string) =>
    setDraft(prev => ({ ...prev, [field]: value }))

  const setEditField = (field: keyof ToolDraft, value: string) =>
    setEditDraft(prev => ({ ...prev, [field]: value }))

  const startEdit = (tool: Tool) => {
    setEditingId(tool.id)
    setEditDraft({
      nombre: tool.nombre,
      pricingMode: tool.precio_total !== null && tool.precio_dia === null ? 'total' : 'daily',
      precio_dia: tool.precio_dia?.toString() ?? '',
      dias_usados: tool.dias_usados?.toString() ?? '',
      precio_total: tool.precio_total?.toString() ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(emptyDraft())
  }

  // ── add ──────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!draft.nombre.trim()) return

    const tid = loading('Guardando herramienta...')
    setIsSaving(true)
    try {
      const { error } = await addTool({
        nombre: draft.nombre.trim(),
        precio_dia: draft.pricingMode === 'daily' ? (Number(draft.precio_dia) || null) : null,
        dias_usados: draft.pricingMode === 'daily' ? (Number(draft.dias_usados) || null) : null,
        precio_total: draft.pricingMode === 'total' ? (Number(draft.precio_total) || null) : null,
        obra_nombre: obraName || null,
      })
      dismiss(tid)
      if (error) { notifError('Error', error.message); return }
      success('Herramienta agregada', draft.nombre.trim())
      setDraft(emptyDraft())
    } finally {
      setIsSaving(false)
    }
  }

  // ── save edit ─────────────────────────────────────────────────────────────

  const handleSaveEdit = async (id: string) => {
    if (!editDraft.nombre.trim()) return
    const tid = loading('Actualizando...')
    try {
      const { error } = await updateTool(id, {
        nombre: editDraft.nombre.trim(),
        precio_dia: editDraft.pricingMode === 'daily' ? (Number(editDraft.precio_dia) || null) : null,
        dias_usados: editDraft.pricingMode === 'daily' ? (Number(editDraft.dias_usados) || null) : null,
        precio_total: editDraft.pricingMode === 'total' ? (Number(editDraft.precio_total) || null) : null,
        obra_nombre: obraName || null,
      })
      dismiss(tid)
      if (error) { notifError('Error', error.message); return }
      success('Herramienta actualizada', editDraft.nombre.trim())
      cancelEdit()
    } finally {
      dismiss(tid)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string, nombre: string) => {
    const { error } = await deleteTool(id)
    if (error) { notifError('Error eliminando', error.message) }
    else success('Eliminada', nombre)
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  const handlePdf = () => generatePdf('tools-pdf-preview', 'herramientas')

  const totalGeneral = tools.reduce((s, t) => s + (t.total_calculado ?? 0), 0)

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ── Modal: confirmar terminar obra ───────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl border border-border bg-secondary flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">¿Agregar otra obra?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Las herramientas de esta obra ya quedaron guardadas</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full gap-2" onClick={handleConfirmNuevaObra}>
                <Plus size={14} />
                Sí, agregar otra obra
              </Button>
              <Button variant="outline" className="w-full" onClick={handleConfirmSalir}>
                No, ir al inicio
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: nombre de obra ─────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            opacity: modalVisible ? 1 : 0,
            transition: 'opacity 0.25s ease',
          }}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-7 space-y-5"
            style={{
              transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
              opacity: modalVisible ? 1 : 0,
              transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl border border-border bg-secondary flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">Nombre de la obra</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Identifica el proyecto antes de continuar</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre *</Label>
              <input
                ref={obraInputRef}
                className={inputStyle}
                placeholder="Ej. Edificio Central, Casa Rodríguez..."
                value={obraInput}
                onChange={e => setObraInput(e.target.value)}
                onKeyDown={handleObraKeyDown}
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleConfirmObra}
              disabled={!obraInput.trim()}
            >
              <Check size={14} />
              Continuar
            </Button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 py-10 space-y-8">

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg border border-border bg-secondary flex items-center justify-center">
            <Wrench size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold tracking-tight">Herramientas</h1>
            {obraName ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {editingObra ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      className="text-sm text-muted-foreground bg-transparent border-b border-border focus:outline-none focus:border-foreground w-48"
                      value={obraInput}
                      onChange={e => setObraInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const t = obraInput.trim()
                          if (t) { setObraName(t); sessionStorage.setItem(SESSION_KEY, t); setEditingObra(false) }
                        }
                        if (e.key === 'Escape') { setObraInput(obraName); setEditingObra(false) }
                      }}
                      autoFocus
                    />
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { const t = obraInput.trim(); if (t) { setObraName(t); sessionStorage.setItem(SESSION_KEY, t); setEditingObra(false) } }}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => { setObraInput(obraName); setEditingObra(false) }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    onClick={() => { setObraInput(obraName); setEditingObra(true) }}
                  >
                    <span>{obraName}</span>
                    <Pencil size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Registra las herramientas usadas en la obra</p>
            )}
          </div>
        </div>

        {/* Add Form */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-medium text-foreground">Agregar herramienta</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nombre *</Label>
              <input
                className={inputStyle}
                placeholder="Ej. Andamio metálico, Taladro, Mezcladora..."
                value={draft.nombre}
                onChange={e => setField('nombre', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de precio</Label>
              <select
                className={inputStyle}
                value={draft.pricingMode}
                onChange={e => setField('pricingMode', e.target.value as PricingMode)}
              >
                <option value="daily">Precio por día</option>
                <option value="total">Precio total fijo</option>
              </select>
            </div>
          </div>

          {draft.pricingMode === 'daily' ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Precio por día (COP)</Label>
                <input
                  className={inputStyle}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={draft.precio_dia}
                  onChange={e => setField('precio_dia', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Días de uso</Label>
                <input
                  className={inputStyle}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={draft.dias_usados}
                  onChange={e => setField('dias_usados', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Precio total (COP)</Label>
              <input
                className={inputStyle}
                type="number"
                min="0"
                placeholder="0"
                value={draft.precio_total}
                onChange={e => setField('precio_total', e.target.value)}
              />
            </div>
          )}

          {/* Preview total */}
          {calcTotal(draft) > 0 && (
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatCurrency(calcTotal(draft))}</span>
              {draft.pricingMode === 'daily' && draft.dias_usados &&
                <span className="ml-1 text-xs">({draft.dias_usados} días × {formatCurrency(Number(draft.precio_dia))})</span>
              }
            </p>
          )}

          <Button
            onClick={handleAdd}
            disabled={!draft.nombre.trim() || isSaving}
            className="gap-2"
            size="sm"
          >
            <Plus size={14} />
            Agregar
          </Button>
        </div>

        {/* Tools List */}
        {!isLoaded ? (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        ) : tools.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Wrench size={24} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay herramientas registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Lista de herramientas ({tools.length})</h2>
                {obraName && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 size={11} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{obraName}</span>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handlePdf}
                disabled={isGenerating}
              >
                <FileDown size={14} />
                {isGenerating ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {tools.map(tool => (
                <div key={tool.id} className="bg-background">
                  {editingId === tool.id ? (
                    /* ── Edit row ── */
                    <div className="p-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nombre</Label>
                          <input
                            className={inputStyle}
                            value={editDraft.nombre}
                            onChange={e => setEditField('nombre', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Tipo de precio</Label>
                          <select
                            className={inputStyle}
                            value={editDraft.pricingMode}
                            onChange={e => setEditField('pricingMode', e.target.value as PricingMode)}
                          >
                            <option value="daily">Por día</option>
                            <option value="total">Total fijo</option>
                          </select>
                        </div>
                      </div>
                      {editDraft.pricingMode === 'daily' ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Precio/día</Label>
                            <input className={inputStyle} type="number" value={editDraft.precio_dia} onChange={e => setEditField('precio_dia', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Días</Label>
                            <input className={inputStyle} type="number" value={editDraft.dias_usados} onChange={e => setEditField('dias_usados', e.target.value)} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Precio total</Label>
                          <input className={inputStyle} type="number" value={editDraft.precio_total} onChange={e => setEditField('precio_total', e.target.value)} />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1" onClick={() => handleSaveEdit(tool.id)}>
                          <Check size={13} /> Guardar
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1" onClick={cancelEdit}>
                          <X size={13} /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display row ── */
                    <div className="flex items-center gap-4 px-5 py-4">
                      <div className="size-8 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0">
                        <Wrench size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tool.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tool.precio_dia != null
                            ? `${formatCurrency(tool.precio_dia)}/día × ${tool.dias_usados ?? 0} días`
                            : 'Precio fijo'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(tool.total_calculado ?? 0)}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(tool)}>
                          <Pencil size={13} />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDelete(tool.id, tool.nombre)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total footer */}
            <div className="flex justify-between items-center px-5 py-4 rounded-xl border border-border bg-muted/40">
              <span className="text-sm font-medium">Total herramientas</span>
              <span className="text-base font-bold">{formatCurrency(totalGeneral)}</span>
            </div>

            {/* Finish obra */}
            <Button
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={handleFinishObra}
            >
              <Check size={14} />
              Terminar de agregar herramientas
            </Button>
          </div>
        )}
      </main>

      {/* ── PDF Preview (hidden, used for capture) ────────────────────────── */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <div
          id="tools-pdf-preview"
          style={{
            width: 680,
            background: '#fff',
            padding: '40px 48px',
            fontFamily: 'Arial, sans-serif',
            color: '#111',
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '2px solid #111', paddingBottom: 16, marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <FileText size={11} strokeWidth={2.5} color="#888" />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.03em', color: '#888' }}>CotiFactura</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Lista de Herramientas</h1>
            {obraName && (
              <p style={{ fontSize: 15, fontWeight: 600, color: '#333', margin: '4px 0 0' }}>{obraName}</p>
            )}
            <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>
              {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 90px 130px', gap: 0, borderBottom: '1px solid #ddd', paddingBottom: 8, marginBottom: 4 }}>
            {['Herramienta', 'Precio / día', 'Días', 'Total'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {tools.map((tool, i) => (
            <div
              key={tool.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 90px 130px',
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}
            >
              <span style={{ fontSize: 13 }}>{tool.nombre}</span>
              <span style={{ fontSize: 13 }}>
                {tool.precio_dia != null ? formatCurrency(tool.precio_dia) : '—'}
              </span>
              <span style={{ fontSize: 13 }}>
                {tool.dias_usados != null ? tool.dias_usados : tool.precio_total != null ? 'Fijo' : '—'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(tool.total_calculado ?? 0)}</span>
            </div>
          ))}

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '2px solid #111' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 4 }}>TOTAL HERRAMIENTAS</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{formatCurrency(totalGeneral)}</span>
            </div>
          </div>

          {/* Pie de página con marca */}
          <div style={{
            marginTop: 22, paddingTop: 14, borderTop: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <FileText size={11} strokeWidth={2} color="#9ca3af" />
            <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
              Generado con CotiFactura
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}