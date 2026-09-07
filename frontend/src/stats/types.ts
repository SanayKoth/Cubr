import type { Penalty } from '../api/types'

/*
  A solve as the engine sees it. No listId, no scramble — those are UI/storage
  fields and must not affect math.
*/
export type TimedSolve = {
  timeMs: number
  penalty: Penalty
}

/*
  Effective time after applying the penalty. DNF is a sentinel, not a number,
  so it cannot accidentally win a "best" or sneak into a mean as 0.
*/
export type EffectiveTime =
  | { kind: 'numeric'; ms: number }
  | { kind: 'dnf' }

export type StatValue =
  | { kind: 'blank' }
  | { kind: 'dnf' }
  | { kind: 'numeric'; ms: number }

export const AO_NS = [5, 12, 50, 100] as const
export type AoN = (typeof AO_NS)[number]

export type AveragePair = {
  current: StatValue
  best: StatValue
}

export type SessionStats = {
  count: number
  currentSingle: StatValue
  bestSingle: StatValue
  mean: StatValue
  averages: Record<AoN, AveragePair>
}
