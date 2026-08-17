type LogLevel = 'info' | 'warn' | 'error' | 'audit'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  requestId?: string
  userId?: string
  path?: string
  method?: string
  status?: number
  duration?: number
  meta?: Record<string, unknown>
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
  const parts = [base]
  if (entry.requestId) parts.push(`req=${entry.requestId}`)
  if (entry.userId) parts.push(`user=${entry.userId}`)
  if (entry.path) parts.push(`${entry.method ?? ''} ${entry.path}`)
  if (entry.status) parts.push(`status=${entry.status}`)
  if (entry.duration != null) parts.push(`${entry.duration}ms`)
  return parts.join(' | ')
}

function iso() {
  return new Date().toISOString()
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatEntry({ level: 'info', message, timestamp: iso(), ...meta }))
  },

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatEntry({ level: 'warn', message, timestamp: iso(), ...meta }))
  },

  error(message: string, meta?: Record<string, unknown>) {
    console.error(formatEntry({ level: 'error', message, timestamp: iso(), ...meta }))
  },

  audit(message: string, meta?: Record<string, unknown>) {
    console.log(formatEntry({ level: 'audit', message, timestamp: iso(), ...meta }))
  },
}

/**
 * Generates a short random request ID for tracing.
 */
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10)
}
