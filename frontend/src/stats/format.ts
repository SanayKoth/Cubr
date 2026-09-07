import { formatTime } from '../timer/format'
import type { StatValue } from './types'

export function formatStat(value: StatValue): string {
  if (value.kind === 'blank') return '—'
  if (value.kind === 'dnf') return 'DNF'
  return formatTime(value.ms)
}
