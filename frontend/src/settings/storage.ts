import type { TimerInputMode } from './types'

const TIMER_INPUT_KEY = 'cubr.timerInput'

export function readTimerInputMode(): TimerInputMode {
  try {
    const value = window.localStorage.getItem(TIMER_INPUT_KEY)
    if (value === 'keyboard' || value === 'manual') return value
    return 'keyboard'
  } catch {
    return 'keyboard'
  }
}

export function writeTimerInputMode(mode: TimerInputMode) {
  try {
    window.localStorage.setItem(TIMER_INPUT_KEY, mode)
  } catch {
    // private mode / blocked storage — choice still works for this session
  }
}
