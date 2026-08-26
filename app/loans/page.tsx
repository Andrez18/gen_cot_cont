import { WorkerLoansForm } from '@/components/worker-loans-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Préstamos a Trabajadores',
  robots: { index: false, follow: false },
}

export default function LoansPage() {
  return <WorkerLoansForm />
}
