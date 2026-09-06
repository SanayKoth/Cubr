import type { Penalty } from '../api/types'
import {
  INSPECTION_CUE_12_MS,
  INSPECTION_CUE_8_MS,
  INSPECTION_DNF_MS,
  INSPECTION_LIMIT_MS,
} from './types'
import type { InspectionCue, TimerPhase, TimerResult } from './types'

/*
  Pure state machine. No DOM, no React, no KeyboardEvent. The hook calls these
  with performance.now() timestamps; a future touch adapter would call the same
  functions. Keeping this pure means transitions can be checked without a browser.
*/

export type TimerMachineState = {
  phase: TimerPhase
  inspectStart: number | null
  runStart: number | null
  awaitingInspectionRelease: boolean
  penalty: Penalty
  result: TimerResult | null
}

export function createInitialState(): TimerMachineState {
  return {
    phase: 'idle',
    inspectStart: null,
    runStart: null,
    awaitingInspectionRelease: false,
    penalty: 'NONE',
    result: null,
  }
}

export function inspectionPenalty(
  inspectStart: number | null,
  solveStart: number,
): Penalty {
  if (inspectStart === null) return 'NONE'
  const elapsed = solveStart - inspectStart
  if (elapsed <= INSPECTION_LIMIT_MS) return 'NONE'
  if (elapsed <= INSPECTION_DNF_MS) return 'PLUS_TWO'
  return 'DNF'
}

export function inspectionCueAt(
  inspectStart: number | null,
  now: number,
): InspectionCue {
  if (inspectStart === null) return 0
  const elapsed = now - inspectStart
  if (elapsed >= INSPECTION_CUE_12_MS) return 12
  if (elapsed >= INSPECTION_CUE_8_MS) return 8
  return 0
}

export function isInspectionClockRunning(state: TimerMachineState): boolean {
  return (
    state.inspectStart !== null &&
    (state.phase === 'inspecting' ||
      state.phase === 'holding' ||
      state.phase === 'ready')
  )
}

export function needsAnimationFrame(state: TimerMachineState): boolean {
  return state.phase === 'running' || isInspectionClockRunning(state)
}

export function onPress(
  state: TimerMachineState,
  now: number,
  inspectionEnabled: boolean,
): TimerMachineState {
  switch (state.phase) {
    case 'idle':
      if (inspectionEnabled) {
        return { ...state, awaitingInspectionRelease: true, result: null }
      }
      return {
        ...state,
        phase: 'holding',
        awaitingInspectionRelease: false,
        result: null,
      }
    case 'inspecting':
      return { ...state, phase: 'holding', result: null }
    case 'running': {
      const start = state.runStart ?? now
      return {
        ...state,
        phase: 'stopped',
        runStart: null,
        result: {
          timeMs: Math.max(0, now - start),
          penalty: state.penalty,
        },
      }
    }
    case 'holding':
    case 'ready':
    case 'stopped':
      return state
  }
}

export function onRelease(
  state: TimerMachineState,
  now: number,
  inspectionEnabled: boolean,
): TimerMachineState {
  switch (state.phase) {
    case 'idle':
      if (state.awaitingInspectionRelease && inspectionEnabled) {
        return {
          ...state,
          phase: 'inspecting',
          inspectStart: now,
          awaitingInspectionRelease: false,
          result: null,
        }
      }
      return { ...state, awaitingInspectionRelease: false }
    case 'holding':
      if (state.inspectStart !== null) {
        return { ...state, phase: 'inspecting' }
      }
      return { ...state, phase: 'idle' }
    case 'ready':
      return {
        ...state,
        phase: 'running',
        runStart: now,
        penalty: inspectionPenalty(state.inspectStart, now),
        inspectStart: null,
        awaitingInspectionRelease: false,
        result: null,
      }
    case 'stopped':
      return { ...state, phase: 'idle', result: null }
    case 'inspecting':
    case 'running':
      return state
  }
}

export function onHoldThreshold(state: TimerMachineState): TimerMachineState {
  if (state.phase !== 'holding') return state
  return { ...state, phase: 'ready' }
}

export function onCancel(state: TimerMachineState): TimerMachineState {
  if (
    state.phase === 'inspecting' ||
    state.phase === 'holding' ||
    state.phase === 'ready' ||
    state.phase === 'running'
  ) {
    return createInitialState()
  }
  return { ...state, awaitingInspectionRelease: false }
}
