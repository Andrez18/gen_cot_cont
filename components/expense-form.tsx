'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/document-utils'
import { useExpenseRecords, useExpenseReports, usePhotoUpload } from '@/hooks/use-supabase-storage'
import { useNotification } from '@/hooks/use_notification'

type TipoRegistro = 'gasto' | 'ingreso'

const CATEGORIAS = [
  'Materiales', 'Mano de obra', 'Transporte', 'Herramientas',
  'Servicios', 'Pago de cliente', 'Anticipo', 'Otro',
]

function hoy() {
  return new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Input type="date" trabaja en formato ISO (yyyy-mm-dd); el resto de la
// app (informes, listas, PDF) usa dd/mm/yyyy, así que convertimos acá.
function hoyISO() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function isoAFechaDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return hoy()
  return `${d}/${m}/${y}`
}

// El bucket "expense-photos" es privado: uploadPhoto guarda un path con
// prefijo "supabase-storage://expense-photos/..." en vez de una URL usable
// directamente. Acá lo convertimos a una URL firmada para poder mostrarlo.
async function resolveFotoUrl(raw: string): Promise<string | null> {
  if (raw.startsWith('supabase-storage://expense-photos/')) {
    const path = raw.replace('supabase-storage://expense-photos/', '')
    const { data } = await supabase.storage
      .from('expense-photos')
      .createSignedUrl(path, 60 * 60)
    return data?.signedUrl ?? null
  }
  // Formato antiguo (URL pública directa): se usa tal cual.
  return raw
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px',
  fontSize: '13px', color: 'var(--foreground)', background: 'var(--card)', fontFamily: 'Arial, sans-serif', outline: 'none',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

export function ExpenseForm() {
  const { records: registros, addRecord, deleteRecord, clearRecords, isLoaded } = useExpenseRecords()
  const { reports: informes, saveReport } = useExpenseReports()
  const { uploadPhoto, isUploading } = usePhotoUpload()

  const [descripcion, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [cat, setCat] = useState('')
  const [tipo, setTipo] = useState<TipoRegistro>('gasto')
  const [fechaISO, setFechaISO] = useState(hoyISO())
  const [errDesc, setErrDesc] = useState(false)
  const [errMonto, setErrMonto] = useState(false)
  const [informeActual, setInformeActual] = useState<any | null>(null)
  const [vistaInformes, setVistaInformes] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({})
  const [registroAEliminar, setRegistroAEliminar] = useState<{ id: string; descripcion: string } | null>(null)
  const { success, error: notifError, loading, dismiss, warning } = useNotification()

  const ingresos = registros.filter(r => r.tipo === 'ingreso').reduce((a, r) => a + r.monto, 0)
  const gastos   = registros.filter(r => r.tipo === 'gasto').reduce((a, r) => a + r.monto, 0)
  const balance  = ingresos - gastos

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

  const agregar = useCallback(async () => {
    const montoNum = parseFloat(monto)
    let hayError = false
    if (!descripcion.trim()) { setErrDesc(true); hayError = true }
    if (isNaN(montoNum) || montoNum <= 0) { setErrMonto(true); hayError = true }
    if (hayError) {
      setTimeout(() => { setErrDesc(false); setErrMonto(false) }, 1500)
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

    await addRecord({ descripcion: descripcion.trim(), monto: montoNum, cat, tipo, fecha: isoAFechaDisplay(fechaISO), foto_url })
    setDesc(''); setMonto(''); setCat(''); setTipo('gasto')
    setFechaISO(hoyISO())
    setFotoFile(null); setFotoPreview(null)
    setInformeActual(null)
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
      fecha: hoy(), ingresos, gastos, balance,
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
    return <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif', color: 'var(--muted-foreground)' }}>Cargando...</div>
  }

  return (
    <div style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Gastos & Ganancias</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {informes.length > 0 && (
            <button onClick={() => setVistaInformes(v => !v)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'Arial' }}>
              {vistaInformes ? 'Ver registros' : `Historial (${informes.length})`}
            </button>
          )}
          <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {registros.length === 0 ? 'Sin registros pendientes'
              : `${registros.length} registro${registros.length !== 1 ? 's' : ''} pendiente${registros.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {vistaInformes ? (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '16px' }}>
            Historial de informes
          </div>
          {informes.map((inf, i) => (
            <div key={inf.id ?? i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Informe — {inf.fecha}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{inf.total_registros} registros</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[
                  { label: 'Ingresos', value: inf.ingresos, color: 'var(--income-text)' },
                  { label: 'Gastos', value: inf.gastos, color: 'var(--expense-text)' },
                  { label: 'Balance', value: inf.balance, color: inf.balance >= 0 ? 'var(--income-text)' : 'var(--expense-text)' },
                ].map(c => (
                  <div key={c.label} style={{ background: 'var(--muted)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '2px' }}>{c.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: c.color }}>{formatCurrency(c.value)}</div>
                  </div>
                ))}
              </div>
              {inf.gastos_por_cat && Object.keys(inf.gastos_por_cat).length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {Object.entries(inf.gastos_por_cat).map(([cat, total]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: 'var(--muted-foreground)', borderTop: '1px solid var(--muted)' }}>
                      <span>{cat}</span>
                      <span style={{ color: 'var(--expense-text)' }}>{formatCurrency(total as number)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Tarjetas resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '28px' }}>
            {[
              { label: 'Ingresos', value: ingresos, color: 'var(--income-text)' },
              { label: 'Gastos', value: gastos, color: 'var(--expense-text)' },
              { label: 'Balance', value: balance, color: balance >= 0 ? 'var(--income-text)' : 'var(--expense-text)' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--muted)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', whiteSpace: 'nowrap' }}>{c.label}</div>
                <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: c.color, wordBreak: 'break-word' }}>{formatCurrency(c.value)}</div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginBottom: '10px' }}>
              Agregar registro
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input value={descripcion} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregar()}
                placeholder="Descripción"
                style={{ ...inputStyle, flex: 1, minWidth: '130px', borderColor: errDesc ? 'var(--destructive)' : 'var(--border)' }} />
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregar()}
                placeholder="Monto" min={0}
                style={{ ...inputStyle, width: '150px', borderColor: errMonto ? 'var(--destructive)' : 'var(--border)' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...selectStyle, width: '140px' }}>
                <option value="">Categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoRegistro)} style={{ ...selectStyle, width: '140px' }}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
              <input type="date" value={fechaISO} onChange={e => setFechaISO(e.target.value || hoyISO())}
                style={{ ...inputStyle, width: '150px' }} />

              {/* Botón foto */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px', color: fotoPreview ? 'var(--income-text)' : 'var(--muted-foreground)', background: fotoPreview ? 'var(--income-bg)' : 'var(--card)', whiteSpace: 'nowrap' }}>
                📷 {fotoPreview ? 'Foto lista' : 'Foto'}
                <input type="file" accept="image/*" capture="environment" onChange={handleFotoChange} style={{ display: 'none' }} />
              </label>

              <button onClick={agregar} disabled={isUploading}
                style={{ background: isUploading ? 'var(--muted-foreground)' : 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: isUploading ? 'not-allowed' : 'pointer', fontFamily: 'Arial', whiteSpace: 'nowrap' }}>
                {isUploading ? 'Subiendo...' : '+ Agregar'}
              </button>
            </div>

            {/* Preview foto */}
            {fotoPreview && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={fotoPreview} alt="preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
                <button onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                  style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', fontSize: '13px' }}>
                  Quitar foto
                </button>
              </div>
            )}
          </div>

          {/* Lista */}
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px' }}>
            {registros.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
                Aún no hay registros. Agregá gastos o ingresos arriba.
              </div>
            ) : registros.map(r => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', borderBottom: '1px solid var(--muted)', fontSize: '13px', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: r.tipo === 'ingreso' ? 'var(--income-text)' : 'var(--destructive)', display: 'inline-block' }} />
                  <span style={{ flex: 1, color: 'var(--foreground)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.descripcion}
                  </span>
                  {r.foto_url && (
                    fotoUrls[r.id] ? (
                      <button
                        onClick={() => setFotoModal(fotoUrls[r.id])}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
                      >
                        <img src={fotoUrls[r.id]} alt="recibo" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                      </button>
                    ) : (
                      <span style={{ height: '32px', width: '32px', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0, color: 'var(--muted-foreground)' }}>
                        📷
                      </span>
                    )
                  )}
                  <button onClick={() => setRegistroAEliminar({ id: r.id, descripcion: r.descripcion })}
                    style={{ background: 'none', border: 'none', color: 'var(--border)', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, fontFamily: 'Arial', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--destructive)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--border)')}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '15px' }}>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', flex: 1 }}>{r.cat || '—'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{r.fecha}</span>
                  <span style={{ fontWeight: 600, color: r.tipo === 'ingreso' ? 'var(--income-text)' : 'var(--expense-text)', fontSize: '13px', flexShrink: 0 }}>
                    {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

          <button onClick={generarInforme} disabled={registros.length === 0}
            style={{ display: 'block', width: '100%', background: registros.length === 0 ? 'var(--border)' : 'var(--primary)', color: 'var(--primary-foreground)', border: 'none', borderRadius: '6px', padding: '11px', fontSize: '14px', fontWeight: 'bold', cursor: registros.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Arial', letterSpacing: '0.03em' }}>
            Generar informe
          </button>

          {informeActual && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px 24px', marginTop: '20px', fontSize: '13px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Informe generado — {informeActual.fecha}</div>
              {[
                { label: 'Total ingresos', value: informeActual.ingresos, color: 'var(--income-text)' },
                { label: 'Total gastos', value: informeActual.gastos, color: 'var(--expense-text)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--muted)' }}>
                  <span>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{formatCurrency(r.value)}</span>
                </div>
              ))}
              {informeActual.gastos_por_cat && Object.keys(informeActual.gastos_por_cat).length > 0 && (
                <>
                  <div style={{ margin: '12px 0 6px', fontSize: '12px', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gastos por categoría</div>
                  {Object.entries(informeActual.gastos_por_cat).map(([cat, total]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--muted)' }}>
                      <span>{cat}</span><span style={{ color: 'var(--expense-text)' }}>{formatCurrency(total as number)}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '8px', borderTop: '1px solid var(--foreground)', fontWeight: 'bold', fontSize: '14px' }}>
                <span>Balance final</span>
                <span style={{ background: informeActual.balance >= 0 ? 'var(--income-bg)' : 'var(--expense-bg)', color: informeActual.balance >= 0 ? 'var(--income-text)' : 'var(--expense-text)', padding: '2px 10px', borderRadius: '20px', fontSize: '13px' }}>
                  {formatCurrency(informeActual.balance)}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal confirmar eliminación */}
      {registroAEliminar && (
        <div
          onClick={() => setRegistroAEliminar(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card)', borderRadius: '10px', padding: '22px',
              maxWidth: '340px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '6px' }}>
              ¿Eliminar este registro?
            </div>
            <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginBottom: '20px' }}>
              Se eliminará "{registroAEliminar.descripcion}". Esta acción no se puede deshacer.
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRegistroAEliminar(null)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer', color: 'var(--foreground)', fontFamily: 'Arial' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                style={{ background: 'var(--destructive)', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: 'pointer', color: 'var(--destructive-foreground)', fontFamily: 'Arial', fontWeight: 600 }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal foto ampliada */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '24px', cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setFotoModal(null)}
            aria-label="Cerrar"
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              width: '36px', height: '36px', borderRadius: '50%', fontSize: '20px',
              cursor: 'pointer', lineHeight: 1, fontFamily: 'Arial',
            }}
          >
            ×
          </button>
          <img
            src={fotoModal}
            alt="Comprobante"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)', cursor: 'default',
            }}
          />
        </div>
      )}
    </div>
  )
}