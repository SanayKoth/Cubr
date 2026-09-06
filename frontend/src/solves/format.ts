import type { Penalty } from '../api/types'
import { formatTime } from '../timer/format'

/*
  Display math only. timeMs stays the raw stopwatch value; +2 is added here
  for the label and never written back.
*/
export function formatSolveTime(timeMs: number, penalty: Penalty): string {
  if (penalty === 'DNF') return `DNF(${formatTime(timeMs)})`
  if (penalty === 'PLUS_TWO') return `${formatTime(timeMs + 2000)}+`
  return formatTime(timeMs)
}
