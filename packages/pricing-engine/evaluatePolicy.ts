type Checks = { name: string; ok: boolean; [k: string]: any }
export type PolicyEval = { ok: boolean; checks: Checks[] }

export function evaluatePolicy(
  currentAmount: number,
  proposedAmount: number,
  opts: { 
    maxPctDelta?: number; 
    floor?: number; 
    ceiling?: number; 
    dailyBudgetUsedPct?: number; 
    dailyBudgetPct?: number 
  } = {}
): PolicyEval {
  const checks: Checks[] = []
  const delta = proposedAmount - currentAmount
  const deltaPct = currentAmount === 0 ? 1 : Math.abs(delta) / currentAmount
  
  if (opts.maxPctDelta != null) {
    // When current amount is 0, allow any positive proposed amount
    const ok = currentAmount === 0 ? proposedAmount > 0 : deltaPct <= opts.maxPctDelta
    checks.push({ 
      name: 'maxPctDelta', 
      ok, 
      deltaPct, 
      limit: opts.maxPctDelta 
    })
  }
  
  if (opts.floor != null) {
    checks.push({ 
      name: 'floor', 
      ok: proposedAmount >= opts.floor, 
      floor: opts.floor,
      proposedAmount
    })
  }
  
  if (opts.ceiling != null) {
    checks.push({ 
      name: 'ceiling', 
      ok: proposedAmount <= opts.ceiling, 
      ceiling: opts.ceiling,
      proposedAmount
    })
  }
  
  if (opts.dailyBudgetPct != null && opts.dailyBudgetUsedPct != null) {
    const remaining = (opts.dailyBudgetPct ?? 0) - (opts.dailyBudgetUsedPct ?? 0)
    checks.push({ 
      name: 'dailyBudget', 
      ok: deltaPct <= remaining, 
      used: opts.dailyBudgetUsedPct, 
      limit: opts.dailyBudgetPct,
      remaining
    })
  }
  
  return { ok: checks.every(c => c.ok), checks }
}
