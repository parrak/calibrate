export async function ensureIdempotent(
  db: { event: { findFirst: Function; create: Function } },
  key: string,
  scope: string
): Promise<boolean> {
  const found = await db.findFirst({ 
    where: { 
      kind: 'IDEMPOTENCY', 
      payload: { 
        path: ['key'], 
        equals: key 
      } 
    } 
  })
  
  if (found) return false
  
  await db.create({ 
    data: { 
      kind: 'IDEMPOTENCY', 
      payload: { key, scope } 
    } 
  })
  
  return true
}
