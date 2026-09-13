'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/document-utils'
import { useExpenseRecords, useExpenseReports, usePhotoUpload } from '@/hooks/use-supabase-storage'
import { useNotification } from '@/hooks/use_notification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  Camera,
  FileText,
  X,
  Image as ImageIcon,
  History,
  Pencil,
} from 'lucide-react'

type TipoRegistro = 'gasto' | 'ingreso'

const CATEGORIAS = [
  'Materiales', 'Mano de obra', 'Transporte', 'Herramientas',
  'Servicios', 'Pago de cliente', 'Anticipo', 'Otro',
]

function hoyISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isoAFechaDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

async function resolveFotoUrl(raw: string): Promise<string | null> {
  if (raw.startsWith('supabase-storage://expense-photos/')) {
    const path = raw.replace('supabase-storage://expense-photos/', '')
    const { data } = await supabase.storage
      .from('expense-photos')
      .createSignedUrl(path, 60 * 60)
    return data?.signedUrl ?? null
  }
  return raw
}

export function ExpenseForm() {
  const { records: registros, addRecord, deleteRecord, clearRecords, isLoaded } = useExpenseRecords()
  const { reports: informes, saveReport } = useExpenseReports()
  const { uploadPhoto, isUploading } = usePhotoUpload()

  const [descripcion, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [cat, setCat] = useState('')
  const [tipo, setTipo] = useState<TipoRegistro>('gasto')
  const [fechaISO, setFechaISO] = useState(hoyISO())
  const [informeActual, setInformeActual] = useState<any | null>(null)
  const [vistaInformes, setVistaInformes] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({})
  const [registroAEliminar, setRegistroAEliminar] = useState<{ id: string; descripcion: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { success, error: notifError, loading, dismiss, warning } = useNotification()

  const ingresos = registros.filter(r => r.tipo === 'ingreso').reduce((a, r) => a + r.monto, 0)
  const gastos = registros.filter(r => r.tipo === 'gasto').reduce((a, r) => a + r.monto, 0)
  const balance = ingresos - gastos

  useEffect(() => {
    let cancelled = false
    const pendientes = registros.filter(r => r.foto_url && !fotoUrls[r.id])
    if (pendientes.length === 0) return

    ;(async () => {
      const resueltas = await Promise.all(
        pendientes.map(async (r) => [r.id, await resolveFotoUrl(r.foto_url!)] as const)
      )
      if (cancelled) return
      setFotoUrls(prev => {
        const next = { ...prev }
        for (const [id, url] of resueltas) if (url) next[id] = url
        return next
      })
    })()

    return () => { cancelled = true }
  }, [registros])

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const limpiarFormulario = () => {
    setDesc('')
    setMonto('')
    setCat('')
    setTipo('gasto')
    setFechaISO(hoyISO())
    setFotoFile(null)
    setFotoPreview(null)
    setEditingId(null)
  }

  const agregar = useCallback(async () => {
    const montoNum = parseFloat(monto)
    if (!descripcion.trim() || isNaN(montoNum) || montoNum <= 0) {
      warning('Campos incompletos', 'Completá la descripción y el monto')
      return
    }

    let foto_url: string | undefined
    if (fotoFile) {
      const loadingId = loading('Subiendo foto...')
      foto_url = await uploadPhoto(fotoFile) ?? undefined
      dismiss(loadingId)
      if (!foto_url) {
        notifError('Error al subir la foto', 'Intentá de nuevo')
        return
      }
    }

    await addRecord({
      descripcion: descripcion.trim(),
      monto: montoNum,
      cat,
      tipo,
      fecha: isoAFechaDisplay(fechaISO),
      foto_url,
    })

    limpiarFormulario()
    success(
      tipo === 'gasto' ? 'Gasto registrado' : 'Ingreso registrado',
      `${descripcion} — ${formatCurrency(montoNum)}`
    )
  }, [descripcion, monto, cat, tipo, fechaISO, fotoFile, addRecord, uploadPhoto, success, notifError, warning, loading, dismiss])

  const confirmarEliminar = useCallback(async () => {
    if (!registroAEliminar) return
    await deleteRecord(registroAEliminar.id)
    success('Registro eliminado', registroAEliminar.descripcion)
    setRegistroAEliminar(null)
  }, [registroAEliminar, deleteRecord, success])

  const generarInforme = useCallback(async () => {
    const loadingId = loading('Generando informe...')
    const gastosPorCat = registros
      .filter(r => r.tipo === 'gasto')
      .reduce<Record<string, number>>((acc, r) => {
        const key = r.cat || 'Sin categoría'
        acc[key] = (acc[key] || 0) + r.monto
        return acc
      }, {})

    const informe = {
      fecha: isoAFechaDisplay(hoyISO()),
      ingresos,
      gastos,
      balance,
      gastos_por_cat: gastosPorCat,
      total_registros: registros.length,
    }

    const { data, error } = await saveReport(informe)

    if (error) {
      dismiss(loadingId)
      notifError('Error al generar informe', error.message)
      return
    }

    setInformeActual(data)
    if (data?.id) {
      await clearRecords(registros.map(r => r.id), data.id)
    }
    dismiss(loadingId)
    success('Informe generado', `${registros.length} registros cerrados correctamente`)
  }, [registros, ingresos, gastos, balance, saveReport, clearRecords, success, notifError, loading, dismiss])

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos & Ingresos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registra movimientos y genera informes
          </p>
        </div>
        {informes.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVistaInformes(v => !v)}
          >
            <History className="h-4 w-4 mr-2" />
            {vistaInformes ? 'Ver registros' : `Historial (${informes.length})`}
          </Button>
        )}
      </div>

      {vistaInformes ? (
        /* === VISTA INFORMES === */
        <div className="space-y-4">
          {informes.map((inf, i) => (
            <Card key={inf.id ?? i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Informe — {inf.fecha}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {inf.total_registros} registros
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-green-500/5 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Ingresos</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(inf.ingresos)}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/5 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Gastos</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(inf.gastos)}</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/5 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Balance</p>
                    <p className={`text-sm font-bold ${inf.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(inf.balance)}
                    </p>
                  </div>
                </div>
                {inf.gastos_por_cat && Object.keys(inf.gastos_por_cat).length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    {Object.entries(inf.gastos_por_cat).map(([cat, total]) => (
                      <div key={cat} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(total as number)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ingresos</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(ingresos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gastos</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(gastos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-blue-500/20 bg-blue-500/5`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                    <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`text-lg font-bold ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo registro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTipo('gasto')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    tipo === 'gasto'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Gasto
                </button>
                <button
                  onClick={() => setTipo('ingreso')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                    tipo === 'ingreso'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                      : 'bg-muted text-muted-foreground border border-transparent hover:bg-muted/80'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Ingreso
                </button>
              </div>

              {/* Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Descripción</label>
                  <input
                    value={descripcion}
                    onChange={e => setDesc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregar()}
                    placeholder="Ej: Pago de materiales"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Monto</label>
                  <input
                    type="number"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && agregar()}
                    placeholder="0"
                    min={0}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoría</label>
                  <select
                    value={cat}
                    onChange={e => setCat(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20 cursor-pointer"
                  >
                    <option value="">Sin categoría</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fecha</label>
                  <input
                    type="date"
                    value={fechaISO}
                    onChange={e => setFechaISO(e.target.value || hoyISO())}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Foto (opcional)</label>
                  <label className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-input bg-background px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    {fotoPreview ? 'Foto adjunta' : 'Adjuntar comprobante'}
                    <input type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Preview foto */}
              {fotoPreview && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <img src={fotoPreview} alt="preview" className="h-14 w-14 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{fotoFile?.name}</p>
                  </div>
                  <button
                    onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                    className="text-muted-foreground hover:text-destructive transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <Button
                onClick={agregar}
                disabled={isUploading || !descripcion.trim() || !monto}
                className="w-full"
              >
                {isUploading ? (
                  'Subiendo...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {editingId ? 'Actualizar' : 'Agregar'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de registros */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Registros ({registros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registros.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Aún no hay registros</p>
                  <p className="text-xs mt-1">Agregá gastos o ingresos arriba</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registros.map(r => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      {/* Indicador tipo */}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        r.tipo === 'ingreso' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {r.tipo === 'ingreso'
                          ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          : <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.descripcion}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {r.cat && (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {r.cat}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground">{r.fecha}</span>
                        </div>
                      </div>

                      {/* Foto */}
                      {r.foto_url && (
                        fotoUrls[r.id] ? (
                          <button
                            onClick={() => setFotoModal(fotoUrls[r.id])}
                            className="shrink-0 rounded-md border overflow-hidden hover:opacity-80 transition-opacity"
                          >
                            <img src={fotoUrls[r.id]} alt="recibo" className="h-9 w-9 object-cover" />
                          </button>
                        ) : (
                          <div className="shrink-0 h-9 w-9 rounded-md border flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground animate-pulse" />
                          </div>
                        )
                      )}

                      {/* Monto */}
                      <span className={`text-sm font-bold shrink-0 ${
                        r.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
                      </span>

                      {/* Eliminar */}
                      <button
                        onClick={() => setRegistroAEliminar({ id: r.id, descripcion: r.descripcion })}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generar informe */}
          {registros.length > 0 && (
            <Button
              onClick={generarInforme}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar informe
            </Button>
          )}

          {/* Último informe generado */}
          {informeActual && (
            <Card className="border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Informe generado — {informeActual.fecha}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-500/5 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase">Ingresos</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(informeActual.ingresos)}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/5 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase">Gastos</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(informeActual.gastos)}</p>
                  </div>
                </div>
                {informeActual.gastos_por_cat && Object.keys(informeActual.gastos_por_cat).length > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Por categoría</p>
                    {Object.entries(informeActual.gastos_por_cat).map(([cat, total]) => (
                      <div key={cat} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">{cat}</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(total as number)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-sm font-semibold">Balance final</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    informeActual.balance >= 0
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(informeActual.balance)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Modal confirmar eliminación */}
      {registroAEliminar && (
        <div
          onClick={() => setRegistroAEliminar(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-xl p-6 max-w-sm w-full shadow-xl border"
          >
            <h3 className="text-base font-semibold mb-2">¿Eliminar este registro?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Se eliminará &quot;{registroAEliminar.descripcion}&quot;. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setRegistroAEliminar(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmarEliminar}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setFotoModal(null)}
            className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={fotoModal}
            alt="Comprobante"
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}
    </div>
  )
}
