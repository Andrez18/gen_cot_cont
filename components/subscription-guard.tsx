'use client'

import { useAuth } from '@/hooks/use-auth'
import { useSubscription } from '@/hooks/use-subscription'
import { SubscriptionPaywall } from './subscription-paywall'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase().trim()

export function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { status, refresh } = useSubscription()

  const isAdmin = !!user?.email && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL
  if (isAdmin) return <>{children}</>

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Arial', color: '#6b7280', fontSize: '14px',
        }}
      >
        Verificando suscripción...
      </div>
    )
  }

  if (status === 'inactive' || status === 'pending') {
    return <SubscriptionPaywall status={status} onSubmitted={refresh} />
  }

  return <>{children}</>
}
