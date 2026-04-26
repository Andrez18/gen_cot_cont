import { Header } from '@/components/header'
import { InvoiceForm } from '@/components/invoice-form'

export default function NewInvoicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Nueva Cuenta de Cobro</h1>
            <p className="mt-2 text-muted-foreground">
              Genera una cuenta de cobro profesional con todos los datos requeridos
            </p>
          </div>
          
          <InvoiceForm />
        </div>
      </main>
    </div>
  )
}
