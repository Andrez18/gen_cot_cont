'use client'

import { useEffect, useRef, useCallback } from 'react'

// Hook que guarda automáticamente los datos del formulario en localStorage
// cada vez que cambian, con un debounce de 2 segundos.
// Se usa para que el usuario no pierda su trabajo si cierra el navegador.
export function useAutosave<T>(key: string, data: T, enabled = true) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevDataRef = useRef<string>('')

  // Guardar en localStorage
  const save = useCallback((value: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Silenciar errores de storage lleno
    }
  }, [key])

  // Cargar de localStorage
  const load = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [key])

  // Limpiar localStorage
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silenciar
    }
  }, [key])

  // Efecto de autoguardado con debounce
  useEffect(() => {
    if (!enabled) return

    const serialized = JSON.stringify(data)
    if (serialized === prevDataRef.current) return

    prevDataRef.current = serialized

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save(data)
    }, 2000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, save, enabled])

  // Guardar antes de cerrar la página
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      save(data)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [data, save, enabled])

  return { load, clear }
}
