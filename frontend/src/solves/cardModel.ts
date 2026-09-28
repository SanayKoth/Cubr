import { eventLabel } from '../sessions/events'
import type { ScrambleType } from '../scramble/types'
import { averageOfN, bestSingle, effectiveTime } from '../stats/engine'
import { formatStat } from '../stats/format'
import { formatSolveTime } from './format'
import type { Solve } from './types'

export type SolveCardModel = {
  number: number
  kind: string
  sessionName: string
  timeLabel: string
  pbThen: boolean
  ao5: string
  ao12: string
  scramble: string | null
  when: string
}

export function formatSolveWhen(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  const month = at.toLocaleString('en-US', { month: 'short' })
  const time = at.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${month} ${at.getDate()} · ${time}`
}

export function buildSolveCardModel(
  solves: readonly Solve[],
  solveId: string,
  event: string,
  sessionName: string,
  scrambleType: ScrambleType,
): SolveCardModel | null {
  const index = solves.findIndex((solve) => solve.id === solveId)
  const solve = index >= 0 ? solves[index] : null
  if (!solve) return null

  const prefix = solves.slice(0, index + 1)
  const best = bestSingle(prefix)
  const time = effectiveTime(solve)

  return {
    number: index + 1,
    kind:
      scrambleType === 'WCA'
        ? eventLabel(event)
        : `${eventLabel(event)} ${scrambleType}`,
    sessionName,
    timeLabel: formatSolveTime(solve.timeMs, solve.penalty),
    pbThen:
      best.kind === 'numeric' && time.kind === 'numeric' && best.ms === time.ms,
    ao5: formatStat(averageOfN(prefix, 5)),
    ao12: formatStat(averageOfN(prefix, 12)),
    scramble: solve.scramble,
    when: formatSolveWhen(solve.timestamp),
  }
}

export function solveCardFileName(timeLabel: string): string {
  const slug = timeLabel.replace(/[^\w.+()-]+/g, '-').replace(/^-+|-+$/g, '')
  return `cubr-${slug || 'solve'}.png`
}
