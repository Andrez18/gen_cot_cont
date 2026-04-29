'use client'

import { useState, useCallback } from 'react'
import { formatCurrency } from '@/lib/document-utils'
import { useExpenseRecords, useExpenseReports, usePhotoUpload } from '@/hooks/use-supabase-storage'

type TipoRegistro = 'gasto' | 'ingreso'

const CATEGORIAS = [
  'Materiales', 'Mano de obra', 'Transporte', 'Herramientas',
  'Servicios', 'Pago de cliente', 'Anticipo', 'Otro',
]

function hoy() {
  return new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #d1d5db', borderRadius: '6px', padding: '7px 10px',
  fontSize: '13px', color: '#111827', background: '#fff', fontFamily: 'Arial, sans-serif', outline: 'none',
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
  const [errDesc, setErrDesc] = useState(false)
  const [errMonto, setErrMonto] = useState(false)
  const [informeActual, setInformeActual] = useState<any | null>(null)
  const [vistaInformes, setVistaInformes] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const ingresos = registros.filter(r => r.tipo === 'ingreso').reduce((a, r) => a + r.monto, 0)
  const gastos   = registros.filter(r => r.tipo === 'gasto').reduce((a, r) => a + r.monto, 0)
  const balance  = ingresos - gastos

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
      return
    }

    let foto_url: string | undefined
    if (fotoFile) {
      foto_url = await uploadPhoto(fotoFile) ?? undefined
    }

    await addRecord({ descripcion: descripcion.trim(), monto: montoNum, cat, tipo, fecha: hoy(), foto_url })
    setDesc(''); setMonto(''); setCat(''); setTipo('gasto')
    setFotoFile(null); setFotoPreview(null)
    setInformeActual(null)
  }, [descripcion, monto, cat, tipo, fotoFile, addRecord, uploadPhoto])

  const generarInforme = useCallback(async () => {
    const gastosPorCat = registros
      .filter(r => r.tipo === 'gasto')
      .reduce<Record<string, number>>((acc, r) => {
        const key = r.cat || 'Sin categoría'
        acc[key] = (acc[key] || 0) + r.monto
        return acc
      }, {})

    const informe = { fecha: hoy(), ingresos, gastos, balance, gastos_por_cat: gastosPorCat, total_registros: registros.length }
    const { data } = await saveReport(informe)
    setInformeActual(data)
    await clearRecords(registros.map(r => r.id))
  }, [registros, ingresos, gastos, balance, saveReport, clearRecords])

  if (!isLoaded) {
    return <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>Cargando...</div>
  }

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#111827', padding: '32px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Gastos & Ganancias</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {informes.length > 0 && (
            <button onClick={() => setVistaInformes(v => !v)}
              style={{ background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', color: '#374151', fontFamily: 'Arial' }}>
              {vistaInformes ? 'Ver registros' : `Historial (${informes.length})`}
            </button>
          )}
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {registros.length === 0 ? 'Sin registros pendientes'
              : `${registros.length} registro${registros.length !== 1 ? 's' : ''} pendiente${registros.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {vistaInformes ? (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '16px' }}>
            Historial de informes
          </div>
          {informes.map((inf, i) => (
            <div key={inf.id ?? i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Informe — {inf.fecha}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{inf.total_registros} registros</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[
                  { label: 'Ingresos', value: inf.ingresos, color: '#065f46' },
                  { label: 'Gastos', value: inf.gastos, color: '#991b1b' },
                  { label: 'Balance', value: inf.balance, color: inf.balance >= 0 ? '#065f46' : '#991b1b' },
                ].map(c => (
                  <div key={c.label} style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{c.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: c.color }}>{formatCurrency(c.value)}</div>
                  </div>
                ))}
              </div>
              {inf.gastos_por_cat && Object.keys(inf.gastos_por_cat).length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {Object.entries(inf.gastos_por_cat).map(([cat, total]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#4b5563', borderTop: '1px solid #f3f4f6' }}>
                      <span>{cat}</span>
                      <span style={{ color: '#991b1b' }}>{formatCurrency(total as number)}</span>
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
              { label: 'Ingresos', value: ingresos, color: '#065f46' },
              { label: 'Gastos', value: gastos, color: '#991b1b' },
              { label: 'Balance', value: balance, color: balance >= 0 ? '#065f46' : '#991b1b' },
            ].map(c => (
              <div key={c.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', whiteSpace: 'nowrap' }}>{c.label}</div>
                <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: c.color, wordBreak: 'break-word' }}>{formatCurrency(c.value)}</div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '10px' }}>
              Agregar registro
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input value={descripcion} onChange={e => setDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregar()}
                placeholder="Descripción"
                style={{ ...inputStyle, flex: 1, minWidth: '130px', borderColor: errDesc ? '#ef4444' : '#d1d5db' }} />
              <input type="number" value={monto} onChange={e => setMonto(e.target.value)} onKeyDown={e => e.key === 'Enter' && agregar()}
                placeholder="Monto" min={0}
                style={{ ...inputStyle, width: '150px', borderColor: errMonto ? '#ef4444' : '#d1d5db' }} />
              <select value={cat} onChange={e => setCat(e.target.value)} style={{ ...selectStyle, width: '140px' }}>
                <option value="">Categoría</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoRegistro)} style={{ ...selectStyle, width: '140px' }}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>

              {/* Botón foto */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d1d5db', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '13px', color: fotoPreview ? '#065f46' : '#6b7280', background: fotoPreview ? '#f0fdf4' : '#fff', whiteSpace: 'nowrap' }}>
                📷 {fotoPreview ? 'Foto lista' : 'Foto'}
                <input type="file" accept="image/*" capture="environment" onChange={handleFotoChange} style={{ display: 'none' }} />
              </label>

              <button onClick={agregar} disabled={isUploading}
                style={{ background: isUploading ? '#9ca3af' : '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 14px', fontSize: '13px', cursor: isUploading ? 'not-allowed' : 'pointer', fontFamily: 'Arial', whiteSpace: 'nowrap' }}>
                {isUploading ? 'Subiendo...' : '+ Agregar'}
              </button>
            </div>

            {/* Preview foto */}
            {fotoPreview && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={fotoPreview} alt="preview" style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                <button onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
                  Quitar foto
                </button>
              </div>
            )}
          </div>

          {/* Lista */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px' }}>
            {registros.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Aún no hay registros. Agregá gastos o ingresos arriba.
              </div>
            ) : registros.map(r => (
              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: r.tipo === 'ingreso' ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                  <span style={{ flex: 1, color: '#111827', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.descripcion}
                  </span>
                  {r.foto_url && (
                    <a href={r.foto_url} target="_blank" rel="noopener noreferrer">
                      <img src={r.foto_url} alt="recibo" style={{ height: '32px', width: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e5e7eb' }} />
                    </a>
                  )}
                  <button onClick={() => deleteRecord(r.id)}
                    style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, fontFamily: 'Arial', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#d1d5db')}>×</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '15px' }}>
                  <span style={{ color: '#9ca3af', fontSize: '12px', flex: 1 }}>{r.cat || '—'}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{r.fecha}</span>
                  <span style={{ fontWeight: 600, color: r.tipo === 'ingreso' ? '#065f46' : '#991b1b', fontSize: '13px', flexShrink: 0 }}>
                    {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

          <button onClick={generarInforme} disabled={registros.length === 0}
            style={{ display: 'block', width: '100%', background: registros.length === 0 ? '#d1d5db' : '#111827', color: '#fff', border: 'none', borderRadius: '6px', padding: '11px', fontSize: '14px', fontWeight: 'bold', cursor: registros.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'Arial', letterSpacing: '0.03em' }}>
            Generar informe
          </button>

          {informeActual && (
            <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px 24px', marginTop: '20px', fontSize: '13px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>Informe generado — {informeActual.fecha}</div>
              {[
                { label: 'Total ingresos', value: informeActual.ingresos, color: '#065f46' },
                { label: 'Total gastos', value: informeActual.gastos, color: '#991b1b' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{formatCurrency(r.value)}</span>
                </div>
              ))}
              {informeActual.gastos_por_cat && Object.keys(informeActual.gastos_por_cat).length > 0 && (
                <>
                  <div style={{ margin: '12px 0 6px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gastos por categoría</div>
                  {Object.entries(informeActual.gastos_por_cat).map(([cat, total]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span>{cat}</span><span style={{ color: '#991b1b' }}>{formatCurrency(total as number)}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '8px', borderTop: '1px solid #111827', fontWeight: 'bold', fontSize: '14px' }}>
                <span>Balance final</span>
                <span style={{ background: informeActual.balance >= 0 ? '#d1fae5' : '#fee2e2', color: informeActual.balance >= 0 ? '#065f46' : '#991b1b', padding: '2px 10px', borderRadius: '20px', fontSize: '13px' }}>
                  {formatCurrency(informeActual.balance)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}