import { ToolsForm } from '@/components/tools-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Herramientas',
  robots: { index: false, follow: false },
}

export default function ToolsPage() {
  return <ToolsForm />
}