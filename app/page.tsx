'use client'

// La ruta "/" ya no muestra una pantalla de inicio propia.
// AuthGuard (components/auth-guard.tsx) se encarga de:
//  - Mostrar la landing publica (components/landing-page.tsx) si no hay sesion.
//  - Redirigir automaticamente a /quotation/new si ya hay sesion.
// Este componente solo actua como respaldo minimo mientras eso ocurre.
export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial', color: '#6b7280', fontSize: '14px',
    }}>
      Cargando...
    </div>
  )
}
