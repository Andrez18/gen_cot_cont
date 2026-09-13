'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClients, type ClientRecord } from '@/hooks/use-clients'

interface ClientComboboxProps {
  value: string
  onSelect: (client: ClientRecord) => void
  onCreateNew?: () => void
  placeholder?: string
}

export function ClientCombobox({ value, onSelect, onCreateNew, placeholder = 'Buscar cliente...' }: ClientComboboxProps) {
  const { searchClients } = useClients()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = searchClients(query)
  const showResults = open && (results.length > 0 || query.length > 0)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [query])

  const handleSelect = (client: ClientRecord) => {
    setQuery(client.companyName)
    onSelect(client)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[highlightedIndex]) {
      e.preventDefault()
      handleSelect(results[highlightedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {showResults && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {results.length === 0 && query.length > 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center justify-between">
              <span>Sin resultados para &quot;{query}&quot;</span>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew()
                    setOpen(false)
                  }}
                  className="flex items-center gap-1 text-primary hover:underline text-xs py-1.5 px-2 min-h-[36px]"
                >
                  <Plus className="h-3 w-3" />
                  Nuevo
                </button>
              )}
            </div>
          )}
          {results.map((client, i) => (
            <button
              key={client.companyName}
              type="button"
              onClick={() => handleSelect(client)}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left min-h-[44px]',
                i === highlightedIndex && 'bg-accent text-accent-foreground'
              )}
            >
              <Check className={cn('h-4 w-4 shrink-0', value === client.companyName ? 'opacity-100' : 'opacity-0')} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{client.companyName}</p>
                {client.nit && (
                  <p className="text-xs text-muted-foreground">NIT: {client.nit}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
