import { applyPriceChange } from '@calibr/amazon-connector'

export async function applyToAmazon(priceChange: {
  skuCode: string
  currency: string
  amount: number
  context?: any
}): Promise<{ ok: boolean; message: string; channelResult?: any }> {
  return applyPriceChange({
    skuCode: priceChange.skuCode,
    currency: priceChange.currency,
    amount: priceChange.amount,
    context: priceChange.context,
  })
}
