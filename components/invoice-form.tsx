'use client'

import { useState, useEffect } from 'react'
import { Save, FileDown, Eye } from 'lucide-react'
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
import { Invoice, ClientInfo, ProviderInfo, BankInfo } from '@/lib/types'
import {
  generateDocumentNumber,
  generateId,
  numberToWords,
  DEFAULT_PROVIDER_INFO,
  DEFAULT_BANK_INFO,
  DEFAULT_CLIENT_INFO,
} from '@/lib/document-utils'
import { InvoicePreview } from './invoice-preview'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useInvoices } from '@/hooks/use-supabase-storage'  // ← NUEVO

export function InvoiceForm() {
  // ── Supabase ──────────────────────────────────────────
  const { saveInvoice } = useInvoices()  // ← NUEVO

  // ── localStorage solo para proveedor y banco (autocompletado) ──
  const { value: savedProvider, setValue: setSavedProvider } = useLocalStorage<ProviderInfo>('provider', DEFAULT_PROVIDER_INFO)
  const { value: savedBank, setValue: setSavedBank } = useLocalStorage<BankInfo>('bank', DEFAULT_BANK_INFO)

  const { generatePdf, isGenerating } = usePdfGenerator()

  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)  // ← NUEVO
  const [documentNumber, setDocumentNumber] = useState('')
  const [date, setDate] = useState('')
  const [city, setCity] = useState('Medellín')
  const [client, setClient] = useState<ClientInfo>(DEFAULT_CLIENT_INFO)
  const [provider, setProvider] = useState<ProviderInfo>(savedProvider)
  const [bankInfo, setBankInfo] = useState<BankInfo>(savedBank)
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState<number>(0)

  useEffect(() => {
    setDocumentNumber(generateDocumentNumber())
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => { setProvider(savedProvider) }, [savedProvider])
  useEffect(() => { setBankInfo(savedBank) }, [savedBank])

  const invoice: Invoice = {
    id: generateId(),
    number: documentNumber,
    date,
    city,
    client,
    provider,
    concept,
    amount,
    amountInWords: numberToWords(amount),
    bankInfo,
    createdAt: new Date().toISOString(),
  }

  // ── REEMPLAZADO: ahora guarda en Supabase ──────────────
  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await saveInvoice(invoice)
    setIsSaving(false)
    if (error) {
      alert('Error al guardar: ' + error.message)
      return
    }
    setSavedProvider(provider)
    setSavedBank(bankInfo)
    alert('Cuenta de cobro guardada exitosamente')
  }

  const handleDownloadPdf = async () => {
    try {
      await generatePdf('invoice-preview', `CuentaCobro-${documentNumber}`)
    } catch {
      alert('Error al generar el PDF')
    }
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            Volver a Editar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="number">Número de Cuenta</Label>
            <Input id="number" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="1012" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Medellín" />
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
            <Input id="companyName" value={client.companyName} onChange={(e) => setClient({ ...client, companyName: e.target.value })} placeholder="EDS ANTIOQUEÑA DE COMBUSTIBLES" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" value={client.nit} onChange={(e) => setClient({ ...client, nit: e.target.value })} placeholder="900.207.854-8" />
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
            <Input id="providerName" value={provider.name} onChange={(e) => setProvider({ ...provider, name: e.target.value })} placeholder="Jorge Vallejo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docNumber">Cédula de Ciudadanía</Label>
            <Input id="docNumber" value={provider.documentNumber} onChange={(e) => setProvider({ ...provider, documentNumber: e.target.value })} placeholder="18.506.917" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={provider.phone} onChange={(e) => setProvider({ ...provider, phone: e.target.value })} placeholder="311-344-00-70" />
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
            <Input id="amount" type="number" value={amount || ''} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} placeholder="1650000" className="text-lg" />
            {amount > 0 && (
              <p className="text-sm text-muted-foreground italic">{numberToWords(amount)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="concept">Por Concepto de</Label>
            <Textarea id="concept" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Obras civiles (pintura base aceite negra y gris basalto)" rows={3} />
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
            <Input id="bankEntity" value={bankInfo.entity} onChange={(e) => setBankInfo({ ...bankInfo, entity: e.target.value })} placeholder="Bancolombia" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountType">Tipo de Cuenta</Label>
            <Select value={bankInfo.accountType} onValueChange={(value) => setBankInfo({ ...bankInfo, accountType: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ahorros">Ahorros</SelectItem>
                <SelectItem value="Corriente">Corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Número de Cuenta</Label>
            <Input id="accountNumber" value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} placeholder="91209711252" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountHolder">A Nombre de</Label>
            <Input id="accountHolder" value={bankInfo.accountHolder} onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })} placeholder="María Nathali Gómez Jiménez" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}