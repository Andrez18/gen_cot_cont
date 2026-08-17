'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Save, FileDown, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LineItem, Quotation, ClientInfo, ProviderInfo, BankInfo } from '@/lib/types'
import {
  formatCurrency,
  generateDocumentNumber,
  generateId,
  DEFAULT_PROVIDER_INFO,
  DEFAULT_BANK_INFO,
  DEFAULT_CLIENT_INFO,
  DEFAULT_LEGAL_TEXT,
} from '@/lib/document-utils'
import { quotationSchema, type QuotationFormData } from '@/lib/validations'
import { QuotationPreview } from './quotation-preview'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useQuotations } from '@/hooks/use-supabase-storage'  
import { useNotification } from '@/hooks/use_notification'
import { useSettings } from '@/hooks/use-settings'

const UNITS = ['ml', 'm²', 'm³', 'und', 'global', 'viaje', 'día', 'hora', 'kg', 'lt']

export function QuotationForm() {
  const { saveQuotation } = useQuotations()
  const { providerInfo, bankInfo, clientInfo, isLoaded, signaturePath, hasSignature } = useSettings()
  const { success, error: notifError, loading, dismiss } = useNotification()  

  const { value: savedProvider, setValue: setSavedProvider } = useLocalStorage<ProviderInfo>('provider', DEFAULT_PROVIDER_INFO)
  const { value: savedBank, setValue: setSavedBank } = useLocalStorage<BankInfo>('bank', DEFAULT_BANK_INFO)

  const { generatePdf, isGenerating } = usePdfGenerator()

  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [documentNumber, setDocumentNumber] = useState('')
  const [date, setDate] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    watch,
    control,
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      documentNumber: '',
      date: '',
      city: 'Medellín, Antioquia',
      client: DEFAULT_CLIENT_INFO,
      provider: DEFAULT_PROVIDER_INFO,
      items: [{ id: generateId(), description: '', quantity: 0, unit: 'ml', unitPrice: 0, total: 0 }],
      bankInfo: DEFAULT_BANK_INFO,
      notes: '',
      includeLegalText: true,
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  useEffect(() => {
    const num = generateDocumentNumber()
    const today = new Date().toISOString().split('T')[0]
    setDocumentNumber(num)
    setDate(today)
    setFormValue('documentNumber', num)
    setFormValue('date', today)
  }, [setFormValue])

  useEffect(() => {
    if (isLoaded) {
      setFormValue('provider', { ...providerInfo, signaturePath: signaturePath ?? undefined })
      setFormValue('bankInfo', bankInfo)
      setFormValue('client', clientInfo)
    }
  }, [isLoaded, signaturePath, providerInfo, bankInfo, clientInfo, setFormValue])

  useEffect(() => { setFormValue('provider', savedProvider) }, [savedProvider, setFormValue])
  useEffect(() => { setFormValue('bankInfo', savedBank) }, [savedBank, setFormValue])

  const updateItemTotal = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    const items = watch('items')
    const item = items[index]
    if (!item) return
    const otherField = field === 'quantity' ? 'unitPrice' : 'quantity'
    const total = (field === 'quantity' ? value : item.quantity) * (otherField === 'unitPrice' ? value : item.unitPrice)
    setFormValue(`items.${index}.${field}`, value)
    setFormValue(`items.${index}.total`, total)
  }

  const total = (watchedItems ?? []).reduce((sum, item) => sum + (item?.total ?? 0), 0)

  const buildQuotation = (data: QuotationFormData): Quotation => ({
    id: generateId(),
    number: data.documentNumber,
    date: data.date,
    city: data.city,
    client: data.client,
    provider: data.provider,
    items: data.items,
    total: data.items.reduce((sum, item) => sum + item.total, 0),
    bankInfo: data.bankInfo,
    notes: data.notes,
    legalText: data.includeLegalText ? DEFAULT_LEGAL_TEXT : '',
    createdAt: new Date().toISOString(),
  })

  const onSubmit = async (data: QuotationFormData) => {
    setIsSaving(true)
    const quotation = buildQuotation(data)
    const loadingId = loading('Guardando cotización...')
    const { error } = await saveQuotation(quotation)
    dismiss(loadingId)
    setIsSaving(false)

    if (error) {
      notifError('Error al guardar', error.message)
      return
    }
    setSavedProvider(data.provider)
    setSavedBank(data.bankInfo)
    success('Cotización guardada', 'El documento fue guardado exitosamente')
  }

  const handleDownloadPdf = async () => {
    if (!hasSignature) {
      notifError('Falta tu firma', 'Ve a Configuración y agrega tu firma antes de generar el PDF')
      return
    }
    const loadingId = loading('Generando PDF...')
    try {
      await generatePdf('quotation-preview', `Cotizacion-${documentNumber}`)
      dismiss(loadingId)
      success('PDF generado', 'El archivo se descargó correctamente')
    } catch {
      dismiss(loadingId)
      notifError('Error al generar el PDF', 'Intentá de nuevo')
    }
  }

  if (showPreview) {
    const formData = watch()
    const quotation = buildQuotation(formData)
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Volver a Editar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isGenerating}>
            <FileDown className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </Button>
        </div>
        <QuotationPreview quotation={quotation} />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {isLoaded && !hasSignature && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
          Aún no has agregado tu firma. Ve a{' '}
          <a href="/settings" className="underline font-medium">Configuración</a>{' '}
          para agregarla antes de generar tus documentos en PDF.
        </div>
      )}
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="number">Número de Cotización</Label>
            <Input id="number" {...register('documentNumber')} placeholder="1020" />
            {errors.documentNumber && <p className="text-xs text-destructive">{errors.documentNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" {...register('city')} placeholder="Medellín, Antioquia" />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Razón Social</Label>
            <Input id="companyName" {...register('client.companyName')} placeholder="ANTIOQUEÑA COMBUSTIBLES S.A.S" />
            {errors.client?.companyName && <p className="text-xs text-destructive">{errors.client.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" {...register('client.nit')} placeholder="900.207.854-8" />
            {errors.client?.nit && <p className="text-xs text-destructive">{errors.client.nit.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Ubicación / Sede</Label>
            <Input id="location" {...register('client.location')} placeholder="EDS Manglar" />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detalle de la Cotización</CardTitle>
          <Button size="sm" type="button" onClick={() => append({ id: generateId(), description: '', quantity: 0, unit: 'ml', unitPrice: 0, total: 0 })}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea {...register(`items.${index}.description`)} placeholder="40ml de cerramiento a 2.50m de altura" rows={2} />
                {errors.items?.[index]?.description && <p className="text-xs text-destructive">{errors.items[index]?.description?.message}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input type="number" value={watchedItems?.[index]?.quantity || ''} onChange={(e) => updateItemTotal(index, 'quantity', parseFloat(e.target.value) || 0)} placeholder="40" />
                  {errors.items?.[index]?.quantity && <p className="text-xs text-destructive">{errors.items[index]?.quantity?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select value={watchedItems?.[index]?.unit} onValueChange={(v) => setFormValue(`items.${index}.unit`, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input type="number" value={watchedItems?.[index]?.unitPrice || ''} onChange={(e) => updateItemTotal(index, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="5000" />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="h-9 px-3 py-2 bg-secondary rounded-md text-sm font-medium">
                    {formatCurrency(watchedItems?.[index]?.total ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {errors.items && !errors.items.root && <p className="text-xs text-destructive">{errors.items.message}</p>}
          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Cotización</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider & Bank Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Datos del Contratista</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Nombre</Label>
              <Input id="providerName" {...register('provider.name')} placeholder="Jorge Vallejo" />
              {errors.provider?.name && <p className="text-xs text-destructive">{errors.provider.name.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docNumber">Cédula</Label>
                <Input id="docNumber" {...register('provider.documentNumber')} placeholder="18.506.917" />
                {errors.provider?.documentNumber && <p className="text-xs text-destructive">{errors.provider.documentNumber.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...register('provider.phone')} placeholder="311 344 0070" />
                {errors.provider?.phone && <p className="text-xs text-destructive">{errors.provider.phone.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Datos Bancarios</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankEntity">Entidad</Label>
                <Input id="bankEntity" {...register('bankInfo.entity')} placeholder="Bancolombia" />
                {errors.bankInfo?.entity && <p className="text-xs text-destructive">{errors.bankInfo.entity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Tipo de Cuenta</Label>
                <Select value={watch('bankInfo.accountType')} onValueChange={(v) => setFormValue('bankInfo.accountType', v as 'Ahorros' | 'Corriente')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ahorros">Ahorros</SelectItem>
                    <SelectItem value="Corriente">Corriente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input id="accountNumber" {...register('bankInfo.accountNumber')} placeholder="91209711252" />
              {errors.bankInfo?.accountNumber && <p className="text-xs text-destructive">{errors.bankInfo.accountNumber.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Titular</Label>
              <Input id="accountHolder" {...register('bankInfo.accountHolder')} placeholder="María Nathali Gómez Jiménez" />
              {errors.bankInfo?.accountHolder && <p className="text-xs text-destructive">{errors.bankInfo.accountHolder.message}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes & Legal */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Notas Adicionales</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" {...register('notes')} placeholder="Notas adicionales para la cotización..." rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="legalText" {...register('includeLegalText')} className="h-4 w-4 rounded border-input" />
            <Label htmlFor="legalText" className="text-sm font-normal">
              Incluir texto legal sobre retención en la fuente y seguridad social
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
          <Eye className="h-4 w-4 mr-2" /> Vista Previa
        </Button>
        <Button type="submit" variant="outline" disabled={isSaving} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}