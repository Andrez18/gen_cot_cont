'use client'

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { createPortal } from 'react-dom'

type NotifType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface Notification {
  id: string
  type: NotifType
  title: string
  description?: string
  duration?: number
}

interface NotifContextType {
  notify: (opts: Omit<Notification, 'id'>) => string
  dismiss: (id: string) => void
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
  loading: (title: string, description?: string) => string
}

const NotifContext = createContext<NotifContextType | null>(null)

const COLORS: Record<NotifType, { bar: string; bg: string; title: string; desc: string }> = {
  success: { bar: '#22c55e', bg: 'rgba(20, 40, 25, 0.82)', title: '#f0fdf4', desc: '#86efac' },
  error:   { bar: '#ef4444', bg: 'rgba(40, 15, 15, 0.82)', title: '#fef2f2', desc: '#fca5a5' },
  warning: { bar: '#eab308', bg: 'rgba(40, 35, 10, 0.82)', title: '#fefce8', desc: '#fde047' },
  info:    { bar: '#3b82f6', bg: 'rgba(10, 20, 45, 0.82)', title: '#eff6ff', desc: '#93c5fd' },
  loading: { bar: '#a855f7', bg: 'rgba(25, 10, 40, 0.82)', title: '#faf5ff', desc: '#d8b4fe' },
}

const ICONS: Record<NotifType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
  loading: '⟳',
}

function NotifItem({ notif, onDismiss }: { notif: Notification; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const c = COLORS[notif.type]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const leave = useCallback(() => {
    setLeaving(true)
    setTimeout(onDismiss, 320)
  }, [onDismiss])

  useEffect(() => {
    if (notif.type === 'loading') return
    const t = setTimeout(leave, notif.duration ?? 4000)
    return () => clearTimeout(t)
  }, [notif.duration, notif.type, leave])

  return (
    <div
      onClick={leave}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        background: c.bg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        minWidth: '280px',
        maxWidth: '360px',
        position: 'relative',
        overflow: 'hidden',
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.96)',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
      }}
    >
      {/* Barra lateral */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: '3px', background: c.bar,
        borderRadius: '12px 0 0 12px',
      }} />

      {/* Icono */}
      <div style={{
        width: '22px', height: '22px', borderRadius: '50%',
        background: c.bar + '30', border: `1px solid ${c.bar}60`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', color: c.bar, flexShrink: 0, marginLeft: '6px',
        animation: notif.type === 'loading' ? 'spin 1s linear infinite' : 'none',
      }}>
        {ICONS[notif.type]}
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: c.title, marginBottom: notif.description ? '3px' : 0 }}>
          {notif.title}
        </div>
        {notif.description && (
          <div style={{ fontSize: '12px', color: c.desc, lineHeight: '1.4' }}>
            {notif.description}
          </div>
        )}
      </div>
    </div>
  )
}

function NotifContainer({ notifications, dismiss }: { notifications: Notification[]; dismiss: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {notifications.map(n => (
          <div key={n.id} style={{ pointerEvents: 'auto' }}>
            <NotifItem notif={n} onDismiss={() => dismiss(n.id)} />
          </div>
        ))}
      </div>
    </>,
    document.body
  )
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const notify = useCallback((opts: Omit<Notification, 'id'>) => {
    const id = `notif-${++counter.current}`
    setNotifications(prev => [...prev, { ...opts, id }])
    return id
  }, [])

  const success = useCallback((title: string, description?: string) =>
    notify({ type: 'success', title, description }), [notify])
  const error = useCallback((title: string, description?: string) =>
    notify({ type: 'error', title, description }), [notify])
  const warning = useCallback((title: string, description?: string) =>
    notify({ type: 'warning', title, description }), [notify])
  const info = useCallback((title: string, description?: string) =>
    notify({ type: 'info', title, description }), [notify])
  const loading = useCallback((title: string, description?: string) =>
    notify({ type: 'loading', title, description }), [notify])

  return (
    <NotifContext.Provider value={{ notify, dismiss, success, error, warning, info, loading }}>
      {children}
      <NotifContainer notifications={notifications} dismiss={dismiss} />
    </NotifContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotifContext)
  if (!ctx) throw new Error('useNotification debe usarse dentro de NotificationProvider')
  return ctx
}