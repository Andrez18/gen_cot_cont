'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { useNotification } from '@/hooks/use_notification'

export function MFASettings() {
  const { success, error: notifError, loading: loadingToast, dismiss } = useNotification()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [settingUp, setSettingUp] = useState(false)

  const checkStatus = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/admin/mfa/status', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setMfaEnabled(data.enabled)
    }
    setLoading(false)
  }, [])

  useEffect(() => { checkStatus() }, [checkStatus])

  const handleSetup = async () => {
    setSettingUp(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSettingUp(false); return }

    const res = await fetch('/api/admin/mfa/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    setSettingUp(false)

    if (!res.ok) {
      notifError('Error', data.error ?? `HTTP ${res.status}`)
      return
    }

    // Generar QR localmente (sin dependencia de servicios externos)
    const dataUrl = await QRCode.toDataURL(data.qrData, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
    setQrDataUrl(dataUrl)
    setSecret(data.secret)
  }

  const handleVerify = async () => {
    if (token.length !== 6) return
    setVerifying(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setVerifying(false); return }

    const res = await fetch('/api/admin/mfa/verify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    const data = await res.json()
    setVerifying(false)

    if (!res.ok) {
      notifError('Código incorrecto', data.error)
      return
    }

    success('2FA habilitado', 'Tu cuenta ahora tiene doble factor de autenticación')
    setQrDataUrl(null)
    setSecret(null)
    setToken('')
    setMfaEnabled(true)
  }

  const handleDisable = async () => {
    setDisabling(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setDisabling(false); return }

    const res = await fetch('/api/admin/mfa/disable', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    setDisabling(false)

    if (!res.ok) {
      notifError('Error', 'No se pudo desactivar 2FA')
      return
    }

    success('2FA desactivado', 'Se removió el doble factor de autenticación')
    setMfaEnabled(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
          Cargando configuración de seguridad...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Autenticación de dos factores (2FA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Estado</p>
            <p className="text-xs text-muted-foreground">
              Protege la cuenta admin con un código de tu app de autenticación
            </p>
          </div>
          <Badge variant={mfaEnabled ? 'default' : 'secondary'}>
            {mfaEnabled ? (
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Activo</span>
            ) : (
              <span className="flex items-center gap-1"><ShieldOff className="h-3 w-3" /> Inactivo</span>
            )}
          </Badge>
        </div>

        {!mfaEnabled && !qrDataUrl && (
          <Button onClick={handleSetup} disabled={settingUp} className="w-full gap-2">
            {settingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Habilitar 2FA
          </Button>
        )}

        {qrDataUrl && (
          <div className="space-y-4 border rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">Escanea este código con tu app de autenticación</p>
              <div className="flex justify-center mb-3">
                <div className="bg-white p-4 rounded-lg border">
                  <img src={qrDataUrl} alt="QR 2FA" width={200} height={200} />
                </div>
              </div>
              {secret && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">O ingresa manualmente este código:</p>
                  <code className="block text-xs font-mono bg-muted px-3 py-2 rounded break-all">{secret}</code>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Código de verificación (6 dígitos)</Label>
              <div className="flex gap-2">
                <Input
                  value={token}
                  onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-[0.3em]"
                />
                <Button
                  onClick={handleVerify}
                  disabled={token.length !== 6 || verifying}
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                </Button>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => { setQrDataUrl(null); setSecret(null); setToken('') }}>
              Cancelar
            </Button>
          </div>
        )}

        {mfaEnabled && (
          <div className="space-y-3">
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                2FA está activo. Se requiere un código de autenticación para acceder a las funciones de administrador.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive"
              onClick={handleDisable}
              disabled={disabling}
            >
              {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
              Desactivar 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
