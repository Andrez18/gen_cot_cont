import { Header } from '@/components/header'
import { QuotationForm } from '@/components/quotation-form'

export default function NewQuotationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Nueva Cotización</h1>
            <p className="mt-2 text-muted-foreground">
              Completa los datos para generar tu cotización profesional
            </p>
          </div>
          
          <QuotationForm />
        </div>
      </main>
    </div>
  )
}
