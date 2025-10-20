import { z } from 'zod'

export const PriceSuggestionPayload = z.object({
  idempotencyKey: z.string().min(8),
  skuCode: z.string().min(1),
  currency: z.string().length(3),
  proposedAmount: z.number().int().positive(),
  context: z.record(z.any()).optional(),
  source: z.enum(['AI', 'RULE', 'MANUAL', 'CONNECTOR'])
})

export type PriceSuggestionPayload = z.infer<typeof PriceSuggestionPayload>
