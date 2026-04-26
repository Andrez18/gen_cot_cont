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
