'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_PROVIDER_INFO,
  DEFAULT_BANK_INFO,
  DEFAULT_CLIENT_INFO,
} from '@/lib/document-utils'

const SIGNATURE_URL_TTL = 60 * 60 * 24 // 24h, suficiente para una sesión larga

export function useSettings() {
  const [providerInfo, setProviderInfo] = useState(DEFAULT_PROVIDER_INFO)
  const [bankInfo, setBankInfo] = useState(DEFAULT_BANK_INFO)
  const [clientInfo, setClientInfo] = useState(DEFAULT_CLIENT_INFO)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Firma: se guarda como "path" dentro del bucket privado "signatures"
  // (no como URL, porque las URLs firmadas expiran). signatureUrl es la
  // URL firmada vigente que se usa solo para previsualizar en esta página.
  const [signaturePath, setSignaturePath] = useState<string | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [pendingSignatureFile, setPendingSignatureFile] = useState<File | null>(null)

  const refreshSignatureUrl = useCallback(async (path: string | null) => {
    if (!path) {
      setSignatureUrl(null)
      return
    }
    const { data } = await supabase.storage
      .from('signatures')
      .createSignedUrl(path, SIGNATURE_URL_TTL)
    setSignatureUrl(data?.signedUrl ?? null)
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsLoaded(true); return }

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        if (data.provider_info && Object.keys(data.provider_info).length > 0)
          setProviderInfo(data.provider_info)
        if (data.bank_info && Object.keys(data.bank_info).length > 0)
          setBankInfo(data.bank_info)
        if (data.client_info && Object.keys(data.client_info).length > 0)
          setClientInfo(data.client_info)
        if (data.signature_path) {
          setSignaturePath(data.signature_path)
          await refreshSignatureUrl(data.signature_path)
        }
      }
      setIsLoaded(true)
    }
    load()
  }, [refreshSignatureUrl])

  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return { error: new Error('No autenticado') } }

    let newPath = signaturePath

    if (pendingSignatureFile) {
      const ext = pendingSignatureFile.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(fileName, pendingSignatureFile, { contentType: pendingSignatureFile.type })

      if (uploadError) {
        setIsSaving(false)
        return { error: uploadError }
      }

      // Borramos la firma anterior para no acumular archivos huérfanos.
      if (signaturePath) {
        await supabase.storage.from('signatures').remove([signaturePath])
      }
      newPath = fileName
    }

    // La firma es obligatoria: no se permite guardar la configuración
    // (ni, en consecuencia, generar documentos) sin haberla agregado antes.
    if (!newPath) {
      setIsSaving(false)
      return { error: new Error('Debes agregar tu firma antes de guardar') }
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        provider_info: providerInfo,
        bank_info: bankInfo,
        client_info: clientInfo,
        signature_path: newPath,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setIsSaving(false)

    if (!error) {
      setSignaturePath(newPath)
      setPendingSignatureFile(null)
      await refreshSignatureUrl(newPath)
    }

    return { error }
  }, [providerInfo, bankInfo, clientInfo, pendingSignatureFile, signaturePath, refreshSignatureUrl])

  const removeSignature = useCallback(async () => {
    if (signaturePath) {
      await supabase.storage.from('signatures').remove([signaturePath])
    }
    setSignaturePath(null)
    setSignatureUrl(null)
    setPendingSignatureFile(null)
  }, [signaturePath])

  return {
    providerInfo,
    setProviderInfo,
    bankInfo, setBankInfo,
    clientInfo, setClientInfo,
    isLoaded, isSaving,
    saveSettings,

    signaturePath,
    signatureUrl,
    hasSignature: !!signaturePath || !!pendingSignatureFile,
    pendingSignatureFile,
    setPendingSignatureFile,
    removeSignature,
  }
}
