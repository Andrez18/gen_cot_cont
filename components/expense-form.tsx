'use client'

import { useState, useCallback } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { formatCurrency } from '@/lib/document-utils'

type TipoRegistro = 'gasto' | 'ingreso'

interface Registro {
  id: string
  desc: string
  monto: number
  cat: string
  tipo: TipoRegistro
  fecha: string
}

interface Informe {
  fecha: string
  ingresos: number
  gastos: number
  balance: number
  gastosPorCat: Record<string, number>
  totalRegistros: number
}

const CATEGORIAS = [
  'Materiales',
  'Mano de obra',
  'Transporte',
  'Herramientas',
  'Servicios',
  'Pago de cliente',
  'Anticipo',
  'Otro',
]

function hoy() {
  return new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function generarId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

const inputStyle: React.CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '13px',
  color: '#111827',
  background: '#fff',
  fontFamily: 'Arial, sans-serif',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
}

export function ExpenseForm() {
  const {
    value: registros,
    setValue: setRegistros,
    isLoaded,
  } = useLocalStorage<Registro[]>('gastos-ganancias-registros', [])

  const {
    value: informes,
    setValue: setInformes,
  } = useLocalStorage<Informe[]>('gastos-ganancias-informes', [])

  const [desc, setDesc] = useState('')
  const [monto, setMonto] = useState('')
  const [cat, setCat] = useState('')
  const [tipo, setTipo] = useState<TipoRegistro>('gasto')
  const [errDesc, setErrDesc] = useState(false)
  const [errMonto, setErrMonto] = useState(false)
  const [informeActual, setInformeActual] = useState<Informe | null>(null)
  const [vistaInformes, setVistaInformes] = useState(false)

  const ingresos = registros
    .filter((r) => r.tipo === 'ingreso')
    .reduce((a, r) => a + r.monto, 0)
  const gastos = registros
    .filter((r) => r.tipo === 'gasto')
    .reduce((a, r) => a + r.monto, 0)
  const balance = ingresos - gastos

  const agregar = useCallback(() => {
    const montoNum = parseFloat(monto)
    let hayError = false
    if (!desc.trim()) { setErrDesc(true); hayError = true }
    if (isNaN(montoNum) || montoNum <= 0) { setErrMonto(true); hayError = true }
    if (hayError) {
      setTimeout(() => { setErrDesc(false); setErrMonto(false) }, 1500)
      return
    }
    const nuevo: Registro = {
      id: generarId(),
      desc: desc.trim(),
      monto: montoNum,
      cat,
      tipo,
      fecha: hoy(),
    }
    setRegistros((prev) => [...prev, nuevo])
    setDesc('')
    setMonto('')
    setCat('')
    setTipo('gasto')
    setInformeActual(null)
  }, [desc, monto, cat, tipo, setRegistros])

  const eliminar = useCallback(
    (id: string) => {
      setRegistros((prev) => prev.filter((r) => r.id !== id))
      setInformeActual(null)
    },
    [setRegistros]
  )

  const generarInforme = useCallback(() => {
    const gastosPorCat = registros
      .filter((r) => r.tipo === 'gasto')
      .reduce<Record<string, number>>((acc, r) => {
        const key = r.cat || 'Sin categoría'
        acc[key] = (acc[key] || 0) + r.monto
        return acc
      }, {})

    const informe: Informe = {
      fecha: hoy(),
      ingresos,
      gastos,
      balance,
      gastosPorCat,
      totalRegistros: registros.length,
    }

    setInformeActual(informe)
    setInformes((prev) => [informe, ...prev])
    setRegistros([])
  }, [registros, ingresos, gastos, balance, setInformes, setRegistros])

  if (!isLoaded) {
    return (
      <div style={{ padding: '32px', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>
        Cargando...
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: '#111827',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '28px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '16px',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
          Gastos & Ganancias
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {informes.length > 0 && (
            <button
              onClick={() => setVistaInformes((v) => !v)}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#374151',
                fontFamily: 'Arial',
              }}
            >
              {vistaInformes ? 'Ver registros' : `Historial (${informes.length})`}
            </button>
          )}
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {registros.length === 0
              ? 'Sin registros pendientes'
              : `${registros.length} registro${registros.length !== 1 ? 's' : ''} pendiente${registros.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {vistaInformes ? (
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '16px',
            }}
          >
            Historial de informes
          </div>
          {informes.map((inf, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  Informe — {inf.fecha}
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {inf.totalRegistros} registros
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Ingresos', value: inf.ingresos, color: '#065f46' },
                  { label: 'Gastos', value: inf.gastos, color: '#991b1b' },
                  { label: 'Balance', value: inf.balance, color: inf.balance >= 0 ? '#065f46' : '#991b1b' },
                ].map((c) => (
                  <div key={c.label} style={{ background: '#f9fafb', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>{c.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: c.color }}>
                      {formatCurrency(c.value)}
                    </div>
                  </div>
                ))}
              </div>
              {Object.keys(inf.gastosPorCat).length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  {Object.entries(inf.gastosPorCat).map(([cat, total]) => (
                    <div
                      key={cat}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        color: '#4b5563',
                        borderTop: '1px solid #f3f4f6',
                      }}
                    >
                      <span>{cat}</span>
                      <span style={{ color: '#991b1b' }}>{formatCurrency(total)}</span>
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
            ].map((c) => (
              <div key={c.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 'bold', color: c.color, wordBreak: 'break-word' }}>
                  {formatCurrency(c.value)}
                </div>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '10px' }}>
              Agregar registro
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregar()}
                placeholder="Descripción"
                style={{ ...inputStyle, flex: 1, minWidth: '140px', borderColor: errDesc ? '#ef4444' : '#d1d5db' }}
              />
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregar()}
                placeholder="Monto"
                min={0}
                style={{ ...inputStyle, width: '130px', borderColor: errMonto ? '#ef4444' : '#d1d5db' }}
              />
              <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ ...selectStyle, width: '140px' }}>
                <option value="">Categoría</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRegistro)} style={{ ...selectStyle, width: '110px' }}>
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
              <button
                onClick={agregar}
                style={{
                  background: '#111827', color: '#fff', border: 'none', borderRadius: '6px',
                  padding: '7px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'Arial', whiteSpace: 'nowrap',
                }}
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden', marginBottom: '24px' }}>
            {registros.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                Aún no hay registros. Agregá gastos o ingresos arriba.
              </div>
            ) : (
              registros.map((r) => (
                <div
                  key={r.id}
                  style={{ display: 'flex', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '13px', gap: '8px' }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: r.tipo === 'ingreso' ? '#10b981' : '#ef4444', display: 'inline-block' }} />
                  <span style={{ flex: 1, color: '#111827' }}>{r.desc}</span>
                  <span style={{ color: '#9ca3af', fontSize: '12px', minWidth: '90px' }}>{r.cat || '—'}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', minWidth: '70px', textAlign: 'right' }}>{r.fecha}</span>
                  <span style={{ fontWeight: 600, minWidth: '110px', textAlign: 'right', color: r.tipo === 'ingreso' ? '#065f46' : '#991b1b' }}>
                    {r.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(r.monto)}
                  </span>
                  <button
                    onClick={() => eliminar(r.id)}
                    style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: '16px', padding: '0 2px', lineHeight: 1, fontFamily: 'Arial' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#d1d5db')}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

          <button
            onClick={generarInforme}
            disabled={registros.length === 0}
            style={{
              display: 'block', width: '100%',
              background: registros.length === 0 ? '#d1d5db' : '#111827',
              color: '#fff', border: 'none', borderRadius: '6px', padding: '11px',
              fontSize: '14px', fontWeight: 'bold',
              cursor: registros.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'Arial', letterSpacing: '0.03em',
            }}
          >
            Generar informe
          </button>

          {/* Informe generado */}
          {informeActual && (
            <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px 24px', marginTop: '20px', fontSize: '13px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                Informe generado — {informeActual.fecha}
              </div>
              {[
                { label: 'Total ingresos', value: informeActual.ingresos, color: '#065f46' },
                { label: 'Total gastos', value: informeActual.gastos, color: '#991b1b' },
              ].map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>{formatCurrency(r.value)}</span>
                </div>
              ))}
              {Object.keys(informeActual.gastosPorCat).length > 0 && (
                <>
                  <div style={{ margin: '12px 0 6px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gastos por categoría
                  </div>
                  {Object.entries(informeActual.gastosPorCat).map(([cat, total]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span>{cat}</span>
                      <span style={{ color: '#991b1b' }}>{formatCurrency(total)}</span>
                    </div>
                  ))}
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: '8px', borderTop: '1px solid #111827', fontWeight: 'bold', fontSize: '14px' }}>
                <span>Balance final</span>
                <span style={{
                  background: informeActual.balance >= 0 ? '#d1fae5' : '#fee2e2',
                  color: informeActual.balance >= 0 ? '#065f46' : '#991b1b',
                  padding: '2px 10px', borderRadius: '20px', fontSize: '13px',
                }}>
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