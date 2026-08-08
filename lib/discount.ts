export type DiscountType = 'percentage' | 'fixed'

/**
 * Calcula el monto final a pagar dado el precio base y un descuento.
 * Se centraliza acá para que la ruta de "preview" (validate-discount) y
 * la de "submit" siempre calculen exactamente lo mismo.
 */
export function applyDiscount(
  baseAmount: number,
  discount: { type: DiscountType; value: number } | null
): { discountAmount: number; finalAmount: number } {
  if (!discount) {
    return { discountAmount: 0, finalAmount: baseAmount }
  }

  const raw =
    discount.type === 'percentage'
      ? Math.round((baseAmount * discount.value) / 100)
      : Math.round(discount.value)

  const discountAmount = Math.min(Math.max(raw, 0), baseAmount)
  const finalAmount = baseAmount - discountAmount

  return { discountAmount, finalAmount }
}
