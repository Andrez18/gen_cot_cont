import { Header } from '@/components/header'
import { DocumentHistory } from '@/components/document-history'

export default function HistoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Historial de Documentos</h1>
            <p className="mt-2 text-muted-foreground">
              Consulta y descarga tus cotizaciones y cuentas de cobro guardadas
            </p>
          </div>
          
          <DocumentHistory />
        </div>
      </main>
    </div>
  )
}
