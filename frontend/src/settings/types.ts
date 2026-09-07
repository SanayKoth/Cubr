export type TimerInputMode = 'keyboard' | 'manual'

export type SettingsOutletContext = {
  inputMode: TimerInputMode
  setInputMode: (mode: TimerInputMode) => void
}
