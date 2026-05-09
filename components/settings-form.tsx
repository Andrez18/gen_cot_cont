'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, User, Building2, CreditCard } from 'lucide-react'
import { useSettings } from '@/hooks/use-settings'
import { useNotification } from '@/hooks/use_notification'

export function SettingsForm() {
  const {
    providerInfo, setProviderInfo,
    bankInfo, setBankInfo,
    clientInfo, setClientInfo,
    isLoaded, isSaving,
    saveSettings,
  } = useSettings()

  const { success, error: notifError, loading, dismiss } = useNotification()

  const handleSave = async () => {
    const loadingId = loading('Guardando configuración...')
    const { error } = await saveSettings()
    dismiss(loadingId)
    if (error) {
      notifError('Error al guardar', error.message)
    } else {
      success('Configuración guardada', 'Tus datos se aplicarán en los próximos documentos')
    }
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontFamily: 'Arial' }}>
        Cargando configuración...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estos datos se autocompletarán en tus documentos
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      {/* Datos del prestador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Mis datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nombre completo</Label>
            <Input
              value={providerInfo.name}
              onChange={e => setProviderInfo({ ...providerInfo, name: e.target.value })}
              placeholder="Jorge Vallejo"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select
              value={providerInfo.documentType}
              onValueChange={v => setProviderInfo({ ...providerInfo, documentType: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                <SelectItem value="NIT">NIT</SelectItem>
                <SelectItem value="CE">Cédula Extranjería</SelectItem>
                <SelectItem value="PA">Pasaporte</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número de documento</Label>
            <Input
              value={providerInfo.documentNumber}
              onChange={e => setProviderInfo({ ...providerInfo, documentNumber: e.target.value })}
              placeholder="18.506.917"
            />
          </div>
          <div className="space-y-2">
            <Label>Teléfono / Celular</Label>
            <Input
              value={providerInfo.phone}
              onChange={e => setProviderInfo({ ...providerInfo, phone: e.target.value })}
              placeholder="311 344 0070"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={providerInfo.email}
              onChange={e => setProviderInfo({ ...providerInfo, email: e.target.value })}
              placeholder="tu@email.com"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Dirección</Label>
            <Input
              value={providerInfo.address}
              onChange={e => setProviderInfo({ ...providerInfo, address: e.target.value })}
              placeholder="Calle 123 # 45-67, Medellín"
            />
          </div>
        </CardContent>
      </Card>

      {/* Datos bancarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Datos bancarios
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Entidad bancaria</Label>
            <Input
              value={bankInfo.entity}
              onChange={e => setBankInfo({ ...bankInfo, entity: e.target.value })}
              placeholder="Bancolombia"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de cuenta</Label>
            <Select
              value={bankInfo.accountType}
              onValueChange={v => setBankInfo({ ...bankInfo, accountType: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ahorros">Ahorros</SelectItem>
                <SelectItem value="Corriente">Corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Número de cuenta</Label>
            <Input
              value={bankInfo.accountNumber}
              onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
              placeholder="91209711252"
            />
          </div>
          <div className="space-y-2">
            <Label>Titular de la cuenta</Label>
            <Input
              value={bankInfo.accountHolder}
              onChange={e => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
              placeholder="María Nathali Gómez Jiménez"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cliente por defecto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Cliente por defecto
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Razón social</Label>
            <Input
              value={clientInfo.companyName}
              onChange={e => setClientInfo({ ...clientInfo, companyName: e.target.value })}
              placeholder="ANTIOQUEÑA COMBUSTIBLES S.A.S"
            />
          </div>
          <div className="space-y-2">
            <Label>NIT</Label>
            <Input
              value={clientInfo.nit}
              onChange={e => setClientInfo({ ...clientInfo, nit: e.target.value })}
              placeholder="900.207.854-8"
            />
          </div>
          <div className="space-y-2">
            <Label>Sede / Ubicación</Label>
            <Input
              value={clientInfo.location}
              onChange={e => setClientInfo({ ...clientInfo, location: e.target.value })}
              placeholder="EDS Manglar"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Persona de contacto</Label>
            <Input
              value={clientInfo.contactPerson}
              onChange={e => setClientInfo({ ...clientInfo, contactPerson: e.target.value })}
              placeholder="Nombre del contacto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón abajo también */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  )
}