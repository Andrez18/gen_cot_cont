export interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface BankInfo {
  entity: string
  accountType: string
  accountNumber: string
  accountHolder: string
}

export interface ProviderInfo {
  name: string
  documentType: string
  documentNumber: string
  phone: string
  email: string
  address: string
  // Path dentro del bucket privado "signatures" (no una URL), se resuelve
  // a una URL firmada en el momento de mostrarla. Queda guardado tal cual
  // dentro de cada cotización/cuenta de cobro para que el historial
  // siempre muestre la firma vigente al momento en que se creó el documento.
  signaturePath?: string
}

export interface ClientInfo {
  companyName: string
  nit: string
  location: string
  contactPerson: string
}

export interface Quotation {
  id: string
  number: string
  date: string
  city: string
  client: ClientInfo
  provider: ProviderInfo
  items: LineItem[]
  total: number
  bankInfo: BankInfo
  notes: string
  legalText: string
  createdAt: string
}

export interface Invoice {
  id: string
  number: string
  date: string
  city: string
  client: ClientInfo
  provider: ProviderInfo
  concept: string
  amount: number
  amountInWords: string
  bankInfo: BankInfo
  createdAt: string
}

export type DocumentType = 'quotation' | 'invoice'
