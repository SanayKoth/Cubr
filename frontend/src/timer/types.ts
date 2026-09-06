import type { Penalty } from '../api/types'

/*
  Timer types live next to the machine so the hook, keyboard adapter, and page
  all speak the same vocabulary. Penalty is the backend union (type-only import)
  so we cannot drift from NONE | PLUS_TWO | DNF.
*/

export type TimerPhase =
  | 'idle'
  | 'inspecting'
  | 'holding'
  | 'ready'
  | 'running'
  | 'stopped'

export type TimerResult = {
  timeMs: number
  penalty: Penalty
}

export type InspectionCue = 0 | 8 | 12

export type UseTimerOptions = {
  inspectionEnabled: boolean
  onSolve: (result: TimerResult) => void
}

export const HOLD_THRESHOLD_MS = 300

export const INSPECTION_LIMIT_MS = 15_000
export const INSPECTION_DNF_MS = 17_000
export const INSPECTION_CUE_8_MS = 8_000
export const INSPECTION_CUE_12_MS = 12_000
