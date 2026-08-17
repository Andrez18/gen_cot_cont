import { describe, it, expect } from 'vitest'
import { applyDiscount } from '@/lib/discount'

describe('applyDiscount', () => {
  it('returns full amount when discount is null', () => {
    const result = applyDiscount(100_000, null)
    expect(result).toEqual({ discountAmount: 0, finalAmount: 100_000 })
  })

  it('calculates percentage discount correctly', () => {
    const result = applyDiscount(200_000, { type: 'percentage', value: 10 })
    expect(result).toEqual({ discountAmount: 20_000, finalAmount: 180_000 })
  })

  it('calculates fixed discount correctly', () => {
    const result = applyDiscount(200_000, { type: 'fixed', value: 50_000 })
    expect(result).toEqual({ discountAmount: 50_000, finalAmount: 150_000 })
  })

  it('clamps percentage discount to 0 minimum', () => {
    const result = applyDiscount(100_000, { type: 'percentage', value: -5 })
    expect(result.discountAmount).toBe(0)
    expect(result.finalAmount).toBe(100_000)
  })

  it('clamps discount amount to base amount maximum', () => {
    const result = applyDiscount(100_000, { type: 'fixed', value: 999_999 })
    expect(result.discountAmount).toBe(100_000)
    expect(result.finalAmount).toBe(0)
  })

  it('handles zero base amount', () => {
    const result = applyDiscount(0, { type: 'fixed', value: 10_000 })
    expect(result).toEqual({ discountAmount: 0, finalAmount: 0 })
  })

  it('handles 100% discount', () => {
    const result = applyDiscount(300_000, { type: 'percentage', value: 100 })
    expect(result.discountAmount).toBe(300_000)
    expect(result.finalAmount).toBe(0)
  })
})
