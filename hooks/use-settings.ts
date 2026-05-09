'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DEFAULT_PROVIDER_INFO,
  DEFAULT_BANK_INFO,
  DEFAULT_CLIENT_INFO,
} from '@/lib/document-utils'

export function useSettings() {
  const [providerInfo, setProviderInfo] = useState(DEFAULT_PROVIDER_INFO)
  const [bankInfo, setBankInfo] = useState(DEFAULT_BANK_INFO)
  const [clientInfo, setClientInfo] = useState(DEFAULT_CLIENT_INFO)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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
      }
      setIsLoaded(true)
    }
    load()
  }, [])

  const saveSettings = useCallback(async () => {
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setIsSaving(false); return { error: new Error('No autenticado') } }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        provider_info: providerInfo,
        bank_info: bankInfo,
        client_info: clientInfo,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    setIsSaving(false)
    return { error }
  }, [providerInfo, bankInfo, clientInfo])

  return {
    providerInfo, setProviderInfo,
    bankInfo, setBankInfo,
    clientInfo, setClientInfo,
    isLoaded, isSaving,
    saveSettings,
  }
}