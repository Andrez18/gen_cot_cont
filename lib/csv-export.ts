import type { SupabaseQuotationRow, SupabaseInvoiceRow } from '@/hooks/use-supabase-storage'

function downloadCSV(filename: string, csvContent: string) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCSV(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportQuotationsCSV(quotations: SupabaseQuotationRow[]) {
  const headers = ['Número', 'Fecha', 'Ciudad', 'Cliente', 'NIT', 'Total', 'Creado']
  const rows = quotations.map(q => [
    escapeCSV(q.number),
    escapeCSV(q.date),
    escapeCSV(q.city),
    escapeCSV(q.client?.companyName),
    escapeCSV(q.client?.nit),
    escapeCSV(q.total),
    escapeCSV(new Date(q.created_at).toLocaleDateString('es-CO')),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const date = new Date().toISOString().slice(0, 10)
  downloadCSV(`cotizaciones-${date}.csv`, csv)
}

export function exportInvoicesCSV(invoices: SupabaseInvoiceRow[]) {
  const headers = ['Número', 'Fecha', 'Ciudad', 'Cliente', 'NIT', 'Concepto', 'Monto', 'Creado']
  const rows = invoices.map(i => [
    escapeCSV(i.number),
    escapeCSV(i.date),
    escapeCSV(i.city),
    escapeCSV(i.client?.companyName),
    escapeCSV(i.client?.nit),
    escapeCSV(i.concept),
    escapeCSV(i.amount),
    escapeCSV(new Date(i.created_at).toLocaleDateString('es-CO')),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const date = new Date().toISOString().slice(0, 10)
  downloadCSV(`cuentas-cobro-${date}.csv`, csv)
}
