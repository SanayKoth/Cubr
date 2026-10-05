import type { TimerInputMode } from './types'

const TIMER_INPUT_KEY = 'cubr.timerInput'

export function readTimerInputMode(): TimerInputMode {
  try {
    const value = window.localStorage.getItem(TIMER_INPUT_KEY)
    if (value === 'keyboard' || value === 'manual' || value === 'gan') return value
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

const HIDE_TIME_KEY = 'cubr.hideTime'

export function readHideTimeDuringSolve(): boolean {
  try {
    return window.localStorage.getItem(HIDE_TIME_KEY) === 'on'
  } catch {
    return false
  }
}

export function writeHideTimeDuringSolve(enabled: boolean) {
  try {
    window.localStorage.setItem(HIDE_TIME_KEY, enabled ? 'on' : 'off')
  } catch {
    // private mode / blocked storage — toggle still works for this session
  }
}
