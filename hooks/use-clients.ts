'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './use-auth'
import type { ClientInfo } from '@/lib/types'

export interface ClientRecord {
  companyName: string
  nit: string
  location?: string
  contactPerson?: string
}

// Hook que obtiene todos los clientes únicos del usuario
// (de cotizaciones y cuentas de cobro existentes)
export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) return

    const [quotationsRes, invoicesRes] = await Promise.all([
      supabase.from('quotations').select('client'),
      supabase.from('invoices').select('client'),
    ])

    const clientMap = new Map<string, ClientRecord>()

    for (const row of [...(quotationsRes.data ?? []), ...(invoicesRes.data ?? [])]) {
      const c = row.client as ClientInfo
      if (c?.companyName) {
        const key = c.companyName.toLowerCase().trim()
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            companyName: c.companyName,
            nit: c.nit || '',
            location: c.location || undefined,
            contactPerson: c.contactPerson || undefined,
          })
        }
      }
    }

    setClients(Array.from(clientMap.values()).sort((a, b) => a.companyName.localeCompare(b.companyName)))
    setIsLoaded(true)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Buscar clientes por nombre
  const searchClients = useCallback((query: string): ClientRecord[] => {
    if (!query.trim()) return clients.slice(0, 10)
    const lower = query.toLowerCase()
    return clients
      .filter(c => c.companyName.toLowerCase().includes(lower) || c.nit.includes(lower))
      .slice(0, 10)
  }, [clients])

  return { clients, isLoaded, searchClients, refresh }
}
