import { prisma } from '@calibr/db'

export async function ensureIdempotent(
  key: string, 
  scope: string
): Promise<boolean> {
  const found = await prisma.event.findFirst({ 
    where: { 
      kind: 'IDEMPOTENCY', 
      payload: { 
        path: ['key'], 
        equals: key 
      } 
    } 
  })
  
  if (found) return false
  
  await prisma.event.create({ 
    data: { 
      kind: 'IDEMPOTENCY', 
      payload: { key, scope } 
    } 
  })
  
  return true
}
