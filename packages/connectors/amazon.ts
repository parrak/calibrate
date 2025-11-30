// import { applyPriceChange } from '@calibr/amazon-connector'

export async function applyToAmazon(priceChange: {
  skuCode: string
  currency: string
  amount: number
  context?: any
}): Promise<{ ok: boolean; message: string; channelResult?: any }> {
  // Stub implementation until amazon-connector is available
  return Promise.resolve({
    ok: false,
    message: 'Amazon connector not implemented',
  })
}
