import { z } from 'zod'

// ─── Shared ──────────────────────────────────────────────────────
export const providerInfoSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  documentType: z.string().min(1, 'El tipo de documento es obligatorio'),
  documentNumber: z.string().min(1, 'El número de documento es obligatorio').max(30),
  phone: z.string().min(1, 'El teléfono es obligatorio').max(30),
  email: z.string().email('Email inválido').or(z.literal('')).default(''),
  address: z.string().max(200).default(''),
  signaturePath: z.string().optional(),
})

export const bankInfoSchema = z.object({
  entity: z.string().min(1, 'La entidad bancaria es obligatoria').max(50),
  accountType: z.string().min(1, 'El tipo de cuenta es obligatorio'),
  accountNumber: z.string().min(1, 'El número de cuenta es obligatorio').max(30),
  accountHolder: z.string().min(1, 'El titular es obligatorio').max(100),
})

export const clientInfoSchema = z.object({
  companyName: z.string().min(1, 'La razón social es obligatoria').max(100),
  nit: z.string().min(1, 'El NIT es obligatorio').max(30),
  location: z.string().max(200).default(''),
  contactPerson: z.string().max(100).default(''),
})

// ─── Quotation ───────────────────────────────────────────────────
export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, 'La descripción es obligatoria').max(500),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  unit: z.string().min(1),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
  total: z.number(),
})

export const quotationSchema = z.object({
  documentNumber: z.string().min(1, 'El número es obligatorio').max(20),
  date: z.string().min(1, 'La fecha es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria').max(100),
  client: clientInfoSchema,
  provider: providerInfoSchema,
  items: z.array(lineItemSchema).min(1, 'Agrega al menos un item'),
  bankInfo: bankInfoSchema,
  notes: z.string().max(1000).default(''),
  includeLegalText: z.boolean().default(true),
})

export type QuotationFormData = z.infer<typeof quotationSchema>

// ─── Invoice ─────────────────────────────────────────────────────
export const invoiceSchema = z.object({
  documentNumber: z.string().min(1, 'El número es obligatorio').max(20),
  date: z.string().min(1, 'La fecha es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria').max(100),
  client: clientInfoSchema,
  provider: providerInfoSchema,
  concept: z.string().min(1, 'El concepto es obligatorio').max(1000),
  amount: z.number().min(1, 'El monto debe ser mayor a 0'),
  bankInfo: bankInfoSchema,
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// ─── Expense ─────────────────────────────────────────────────────
export const expenseRecordSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es obligatoria').max(200),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  cat: z.string().optional(),
  tipo: z.enum(['gasto', 'ingreso']),
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  foto_url: z.string().optional(),
})

export type ExpenseRecordFormData = z.infer<typeof expenseRecordSchema>

// ─── Settings ────────────────────────────────────────────────────
export const settingsSchema = z.object({
  providerInfo: providerInfoSchema,
  bankInfo: bankInfoSchema,
  clientInfo: clientInfoSchema,
  hasSignature: z.boolean().refine((val) => val === true, {
    message: 'Debes agregar tu firma antes de guardar',
  }),
})

export type SettingsFormData = z.infer<typeof settingsSchema>

// ─── Payment ─────────────────────────────────────────────────────
export const paymentSubmitSchema = z.object({
  reference: z
    .string()
    .min(4, 'El número de referencia debe tener al menos 4 caracteres')
    .max(30)
    .regex(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones'),
  proofPath: z.string().min(1, 'Debes adjuntar el comprobante'),
  discountCode: z.string().optional(),
})

export type PaymentSubmitData = z.infer<typeof paymentSubmitSchema>

// ─── Discount Code ───────────────────────────────────────────────
export const discountCodeSchema = z.object({
  code: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Solo letras mayúsculas, números y guiones'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive('El valor debe ser mayor a 0'),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
})

export type DiscountCodeFormData = z.infer<typeof discountCodeSchema>
