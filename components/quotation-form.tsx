'use client'

import { useState, useEffect } from 'react'
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
import { QuotationPreview } from './quotation-preview'
import { usePdfGenerator } from '@/hooks/use-pdf-generator'
import { useLocalStorage } from '@/hooks/use-local-storage'

const UNITS = ['ml', 'm²', 'm³', 'und', 'global', 'viaje', 'día', 'hora', 'kg', 'lt']

export function QuotationForm() {
  const { value: savedQuotations, setValue: setSavedQuotations } = useLocalStorage<Quotation[]>('quotations', [])
  const { value: savedProvider, setValue: setSavedProvider } = useLocalStorage<ProviderInfo>('provider', DEFAULT_PROVIDER_INFO)
  const { value: savedBank, setValue: setSavedBank } = useLocalStorage<BankInfo>('bank', DEFAULT_BANK_INFO)
  const { generatePdf, isGenerating } = usePdfGenerator()

  const [showPreview, setShowPreview] = useState(false)
  const [documentNumber, setDocumentNumber] = useState('')
  const [date, setDate] = useState('')
  const [city, setCity] = useState('Medellín, Antioquia')
  const [client, setClient] = useState<ClientInfo>(DEFAULT_CLIENT_INFO)
  const [provider, setProvider] = useState<ProviderInfo>(savedProvider)
  const [bankInfo, setBankInfo] = useState<BankInfo>(savedBank)
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: '', quantity: 0, unit: 'ml', unitPrice: 0, total: 0 }
  ])
  const [notes, setNotes] = useState('')
  const [includeLegalText, setIncludeLegalText] = useState(true)

  useEffect(() => {
    setDocumentNumber(generateDocumentNumber())
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    setProvider(savedProvider)
  }, [savedProvider])

  useEffect(() => {
    setBankInfo(savedBank)
  }, [savedBank])

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = Number(updated.quantity) * Number(updated.unitPrice)
      }
      return updated
    }))
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: generateId(),
      description: '',
      quantity: 0,
      unit: 'ml',
      unitPrice: 0,
      total: 0
    }])
  }

  const removeItem = (id: string) => {
    if (items.length === 1) return
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const total = items.reduce((sum, item) => sum + item.total, 0)

  const quotation: Quotation = {
    id: generateId(),
    number: documentNumber,
    date,
    city,
    client,
    provider,
    items,
    total,
    bankInfo,
    notes,
    legalText: includeLegalText ? DEFAULT_LEGAL_TEXT : '',
    createdAt: new Date().toISOString(),
  }

  const handleSave = () => {
    const newQuotation = { ...quotation, id: generateId() }
    setSavedQuotations([newQuotation, ...savedQuotations])
    setSavedProvider(provider)
    setSavedBank(bankInfo)
    alert('Cotización guardada exitosamente')
  }

  const handleDownloadPdf = async () => {
    try {
      await generatePdf('quotation-preview', `Cotizacion-${documentNumber}`)
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
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
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
    <div className="space-y-6">
      {/* Document Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Documento</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="number">Número de Cotización</Label>
            <Input
              id="number"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="1020"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Medellín, Antioquia"
            />
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
            <Input
              id="companyName"
              value={client.companyName}
              onChange={(e) => setClient({ ...client, companyName: e.target.value })}
              placeholder="ANTIOQUEÑA COMBUSTIBLES S.A.S"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nit">NIT</Label>
            <Input
              id="nit"
              value={client.nit}
              onChange={(e) => setClient({ ...client, nit: e.target.value })}
              placeholder="900.207.854-8"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="location">Ubicación / Sede</Label>
            <Input
              id="location"
              value={client.location}
              onChange={(e) => setClient({ ...client, location: e.target.value })}
              placeholder="EDS Manglar"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Detalle de la Cotización</CardTitle>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid gap-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="40ml de cerramiento a 2.50m de altura"
                  rows={2}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="40"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidad</Label>
                  <Select
                    value={item.unit}
                    onValueChange={(value) => updateItem(item.id, 'unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="h-9 px-3 py-2 bg-secondary rounded-md text-sm font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            </div>
          ))}

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
          <CardHeader>
            <CardTitle className="text-lg">Datos del Contratista</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="providerName">Nombre</Label>
              <Input
                id="providerName"
                value={provider.name}
                onChange={(e) => setProvider({ ...provider, name: e.target.value })}
                placeholder="Jorge Vallejo"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="docNumber">Cédula</Label>
                <Input
                  id="docNumber"
                  value={provider.documentNumber}
                  onChange={(e) => setProvider({ ...provider, documentNumber: e.target.value })}
                  placeholder="18.506.917"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={provider.phone}
                  onChange={(e) => setProvider({ ...provider, phone: e.target.value })}
                  placeholder="311 344 0070"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datos Bancarios</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bankEntity">Entidad</Label>
                <Input
                  id="bankEntity"
                  value={bankInfo.entity}
                  onChange={(e) => setBankInfo({ ...bankInfo, entity: e.target.value })}
                  placeholder="Bancolombia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountType">Tipo de Cuenta</Label>
                <Select
                  value={bankInfo.accountType}
                  onValueChange={(value) => setBankInfo({ ...bankInfo, accountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ahorros">Ahorros</SelectItem>
                    <SelectItem value="Corriente">Corriente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                value={bankInfo.accountNumber}
                onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                placeholder="91209711252"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Titular</Label>
              <Input
                id="accountHolder"
                value={bankInfo.accountHolder}
                onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                placeholder="María Nathali Gómez Jiménez"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes & Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales para la cotización..."
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="legalText"
              checked={includeLegalText}
              onChange={(e) => setIncludeLegalText(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="legalText" className="text-sm font-normal">
              Incluir texto legal sobre retención en la fuente y seguridad social
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowPreview(true)} className="flex-1 sm:flex-none">
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
        <Button variant="outline" onClick={handleSave} className="flex-1 sm:flex-none">
          <Save className="h-4 w-4 mr-2" />
          Guardar
        </Button>
      </div>
    </div>
  )
}
