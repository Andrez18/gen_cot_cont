'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
            fontFamily: 'Arial, sans-serif',
            padding: '16px',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '16px',
              padding: '40px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: '24px',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
              Algo salió mal
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
              Ocurrió un error inesperado. Por favor, intenta de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: '#111827',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
