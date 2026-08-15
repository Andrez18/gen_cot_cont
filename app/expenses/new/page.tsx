import { ExpenseForm } from '@/components/expense-form'
import { Header } from '@/components/header'
import type { Metadata } from 'next'

// Página privada (requiere sesión): no debe indexarse en buscadores.
export const metadata: Metadata = {
  title: 'Registrar gasto',
  robots: { index: false, follow: false },
}

export default function NewExpensePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container px-4 py-8">
        <div className="max-w-4xl mx-auto">          
          <ExpenseForm />
        </div>
      </main>
    </div>
  )
}