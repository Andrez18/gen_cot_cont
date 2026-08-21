import { PayrollForm } from '@/components/payroll-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nómina',
  robots: { index: false, follow: false },
}

export default function PayrollPage() {
  return <PayrollForm />
}
