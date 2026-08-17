import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatCurrency, formatShortDate, formatDate, numberToWords, generateDocumentNumber, generateId } from '@/lib/document-utils'

describe('formatCurrency', () => {
  it('formats COP currency with 0 decimals', () => {
    const result = formatCurrency(150_000)
    expect(result).toContain('150')
    expect(result).not.toMatch(/\.0{2}$/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

describe('formatShortDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatShortDate('')).toBe('')
  })

  it('formats a valid ISO date', () => {
    const result = formatShortDate('2026-03-15')
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('returns raw string for invalid date', () => {
    expect(formatShortDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatDate', () => {
  it('returns empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('formats a valid ISO date with long month', () => {
    const result = formatDate('2026-03-15')
    expect(result).toMatch(/\d{1,2} de \w+ de \d{4}/)
  })
})

describe('numberToWords', () => {
  it('returns cero pesos for 0', () => {
    expect(numberToWords(0)).toBe('cero pesos COP')
  })

  it('converts small amounts correctly', () => {
    const result = numberToWords(1)
    expect(result.toLowerCase()).toContain('un')
    expect(result).toContain('pesos COP')
  })

  it('converts 100 correctly', () => {
    const result = numberToWords(100)
    expect(result.toLowerCase()).toContain('cien')
  })

  it('converts 1000 correctly', () => {
    const result = numberToWords(1_000)
    expect(result.toLowerCase()).toContain('mil')
  })

  it('converts 1,000,000 correctly', () => {
    const result = numberToWords(1_000_000)
    expect(result.toLowerCase()).toContain('millón')
  })

  it('capitalizes the first letter', () => {
    const result = numberToWords(250_000)
    expect(result[0]).toBe(result[0].toUpperCase())
  })

  it('ends with pesos COP', () => {
    expect(numberToWords(42_000)).toContain('pesos COP')
  })
})

describe('generateDocumentNumber', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a 7-character string', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15))
    const result = generateDocumentNumber()
    expect(result).toHaveLength(7)
  })

  it('starts with YYMM from current date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15))
    const result = generateDocumentNumber()
    expect(result).toMatch(/^2601\d{3}$/)
  })

  it('has 3-digit random suffix', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 11, 31))
    const result = generateDocumentNumber()
    const suffix = result.slice(4)
    expect(suffix).toMatch(/^\d{3}$/)
    expect(Number(suffix)).toBeGreaterThanOrEqual(0)
    expect(Number(suffix)).toBeLessThanOrEqual(999)
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values on successive calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })
})
