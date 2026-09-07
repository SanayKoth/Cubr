import type { AoN, AveragePair, EffectiveTime, SessionStats, StatValue, TimedSolve } from './types'

/*
  How many best and worst solves to drop. The leftover count is what we mean:
    Ao5   drop 1+1 → mean of 3
    Ao12  drop 1+1 → mean of 10
    Ao50  drop 5+5 → mean of 40
    Ao100 drop 10+10 → mean of 80
*/
const DROP_EACH: Record<AoN, number> = {
  5: 1,
  12: 1,
  50: 5,
  100: 10,
}

export function effectiveTime(solve: TimedSolve): EffectiveTime {
  if (solve.penalty === 'DNF') return { kind: 'dnf' }
  if (solve.penalty === 'PLUS_TWO') return { kind: 'numeric', ms: solve.timeMs + 2000 }
  return { kind: 'numeric', ms: solve.timeMs }
}

export function compareEffective(a: EffectiveTime, b: EffectiveTime): number {
  if (a.kind === 'dnf' && b.kind === 'dnf') return 0
  if (a.kind === 'dnf') return 1
  if (b.kind === 'dnf') return -1
  return a.ms - b.ms
}

export function currentSingle(solves: readonly TimedSolve[]): StatValue {
  if (solves.length === 0) return { kind: 'blank' }
  const last = effectiveTime(solves[solves.length - 1])
  return last.kind === 'dnf' ? { kind: 'dnf' } : { kind: 'numeric', ms: last.ms }
}

export function bestSingle(solves: readonly TimedSolve[]): StatValue {
  let bestMs: number | null = null
  for (const solve of solves) {
    const next = effectiveTime(solve)
    if (next.kind !== 'numeric') continue
    if (bestMs === null || next.ms < bestMs) bestMs = next.ms
  }
  return bestMs === null ? { kind: 'blank' } : { kind: 'numeric', ms: bestMs }
}

export function sessionMean(solves: readonly TimedSolve[]): StatValue {
  let sum = 0
  let count = 0
  for (const solve of solves) {
    const next = effectiveTime(solve)
    if (next.kind !== 'numeric') continue
    sum += next.ms
    count += 1
  }
  if (count === 0) return { kind: 'blank' }
  return { kind: 'numeric', ms: sum / count }
}

function averageWindow(window: readonly TimedSolve[], dropEach: number): StatValue {
  const sorted = window.map(effectiveTime).sort(compareEffective)
  const remaining = sorted.slice(dropEach, sorted.length - dropEach)
  if (remaining.some((time) => time.kind === 'dnf')) return { kind: 'dnf' }

  let sum = 0
  for (const time of remaining) {
    if (time.kind !== 'numeric') return { kind: 'dnf' }
    sum += time.ms
  }
  return { kind: 'numeric', ms: sum / remaining.length }
}

export function averageOfN(solves: readonly TimedSolve[], n: AoN): StatValue {
  if (solves.length < n) return { kind: 'blank' }
  return averageWindow(solves.slice(solves.length - n), DROP_EACH[n])
}

export function bestAverageOfN(solves: readonly TimedSolve[], n: AoN): StatValue {
  if (solves.length < n) return { kind: 'blank' }

  const dropEach = DROP_EACH[n]
  let bestMs: number | null = null
  let sawDnf = false

  for (let start = 0; start + n <= solves.length; start += 1) {
    const result = averageWindow(solves.slice(start, start + n), dropEach)
    if (result.kind === 'dnf') {
      sawDnf = true
      continue
    }
    if (result.kind === 'numeric' && (bestMs === null || result.ms < bestMs)) {
      bestMs = result.ms
    }
  }

  if (bestMs !== null) return { kind: 'numeric', ms: bestMs }
  if (sawDnf) return { kind: 'dnf' }
  return { kind: 'blank' }
}

function pairFor(solves: readonly TimedSolve[], n: AoN): AveragePair {
  return {
    current: averageOfN(solves, n),
    best: bestAverageOfN(solves, n),
  }
}

export function computeSessionStats(solves: readonly TimedSolve[]): SessionStats {
  return {
    count: solves.length,
    currentSingle: currentSingle(solves),
    bestSingle: bestSingle(solves),
    mean: sessionMean(solves),
    averages: {
      5: pairFor(solves, 5),
      12: pairFor(solves, 12),
      50: pairFor(solves, 50),
      100: pairFor(solves, 100),
    },
  }
}
