'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, FileDown, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useNotification } from '@/hooks/use_notification'
import { useSettings } from '@/hooks/use-settings'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Invoice, ClientInfo, ProviderInfo, BankInfo } from '@/lib/types'
import {
  generateDocumentNumber,
  generateId,
  numberToWords,
  DEFAULT_PROVIDER_INFO,
  DEFAULT_BANK_INFO,
  DEFAULT_CLIENT_INFO,
} from '@/lib/document-utils'
import { invoiceSchema, type InvoiceFormData } from '@/lib/validations'
import { InvoicePreview } from './invoice-preview'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useInvoices } from '@/hooks/use-supabase-storage'  

export function InvoiceForm() {
  const { saveInvoice } = useInvoices()  
  const { providerInfo, bankInfo, clientInfo, isLoaded, signaturePath, hasSignature } = useSettings()

  const { value: savedProvider, setValue: setSavedProvider } = useLocalStorage<ProviderInfo>('provider', DEFAULT_PROVIDER_INFO)
  const { value: savedBank, setValue: setSavedBank } = useLocalStorage<BankInfo>('bank', DEFAULT_BANK_INFO)

  const { generatePdf, isGenerating } = usePdfGenerator()
  const { success, error: notifError, loading, dismiss } = useNotification()

  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue: setFormValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      documentNumber: '',
      date: '',
      city: 'Medellín',
      client: DEFAULT_CLIENT_INFO,
      provider: DEFAULT_PROVIDER_INFO,
      concept: '',
      amount: 0,
      bankInfo: DEFAULT_BANK_INFO,
    },
  })

  const watchedAmount = watch('amount')

  useEffect(() => {
    setFormValue('documentNumber', generateDocumentNumber())
    setFormValue('date', new Date().toISOString().split('T')[0])
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

  const buildInvoice = (data: InvoiceFormData): Invoice => ({
    id: generateId(),
    number: data.documentNumber,
    date: data.date,
    city: data.city,
    client: data.client,
    provider: data.provider,
    concept: data.concept,
    amount: data.amount,
    amountInWords: numberToWords(data.amount),
    bankInfo: data.bankInfo,
    createdAt: new Date().toISOString(),
  })

  const onSubmit = async (data: InvoiceFormData) => {
    setIsSaving(true)
    const invoice = buildInvoice(data)
    const loadingId = loading('Guardando cuenta de cobro...')
    const { error } = await saveInvoice(invoice)
    dismiss(loadingId)
    setIsSaving(false)

    if (error) {
      notifError('Error al guardar', error.message)
      return
    }
    setSavedProvider(data.provider)
    setSavedBank(data.bankInfo)
    success('Cuenta de cobro guardada', 'El documento fue guardado exitosamente')
  }

  const handleDownloadPdf = async () => {
    if (!hasSignature) {
      notifError('Falta tu firma', 'Ve a Configuración y agrega tu firma antes de generar el PDF')
      return
    }
    const loadingId = loading('Generando PDF...')
    try {
      await generatePdf('invoice-preview', `CuentaCobro-${watch('documentNumber')}`)
      dismiss(loadingId)
      success('PDF generado', 'El archivo se descargó correctamente')
    } catch {
      dismiss(loadingId)
      notifError('Error al generar el PDF', 'Intentá de nuevo')
    }
  }

  if (showPreview) {
    const formData = watch()
    const invoice = buildInvoice(formData)
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
        <InvoicePreview invoice={invoice} />
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
            <Label htmlFor="number">Número de Cuenta</Label>
            <Input id="number" {...register('documentNumber')} placeholder="1012" />
            {errors.documentNumber && <p className="text-xs text-destructive">{errors.documentNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" {...register('city')} placeholder="Medellín" />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cliente (Debe a)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Razón Social</Label>
            <Input id="companyName" {...register('client.companyName')} placeholder="EDS ANTIOQUEÑA DE COMBUSTIBLES" />
            {errors.client?.companyName && <p className="text-xs text-destructive">{errors.client.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" {...register('client.nit')} placeholder="900.207.854-8" />
            {errors.client?.nit && <p className="text-xs text-destructive">{errors.client.nit.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Provider Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Beneficiario</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="providerName">Nombre Completo</Label>
            <Input id="providerName" {...register('provider.name')} placeholder="Jorge Vallejo" />
            {errors.provider?.name && <p className="text-xs text-destructive">{errors.provider.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="docNumber">Cédula de Ciudadanía</Label>
            <Input id="docNumber" {...register('provider.documentNumber')} placeholder="18.506.917" />
            {errors.provider?.documentNumber && <p className="text-xs text-destructive">{errors.provider.documentNumber.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" {...register('provider.phone')} placeholder="311-344-00-70" />
            {errors.provider?.phone && <p className="text-xs text-destructive">{errors.provider.phone.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Amount & Concept */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalle del Cobro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor a Cobrar (COP)</Label>
            <Input id="amount" type="number" {...register('amount', { valueAsNumber: true })} placeholder="1650000" className="text-lg" />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            {watchedAmount > 0 && (
              <p className="text-sm text-muted-foreground italic">{numberToWords(watchedAmount)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="concept">Por Concepto de</Label>
            <Textarea id="concept" {...register('concept')} placeholder="Obras civiles (pintura base aceite negra y gris basalto)" rows={3} />
            {errors.concept && <p className="text-xs text-destructive">{errors.concept.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Bank Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Datos Bancarios para Pago</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bankEntity">Entidad Bancaria</Label>
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
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Número de Cuenta</Label>
            <Input id="accountNumber" {...register('bankInfo.accountNumber')} placeholder="91209711252" />
            {errors.bankInfo?.accountNumber && <p className="text-xs text-destructive">{errors.bankInfo.accountNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolder">A Nombre de</Label>
            <Input id="accountHolder" {...register('bankInfo.accountHolder')} placeholder="María Nathali Gómez Jiménez" />
            {errors.bankInfo?.accountHolder && <p className="text-xs text-destructive">{errors.bankInfo.accountHolder.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
        <Button type="submit" variant="outline" disabled={isSaving} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}