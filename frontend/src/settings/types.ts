export type TimerInputMode = 'keyboard' | 'manual' | 'gan'

export type GanStatus = 'disconnected' | 'connecting' | 'connected'

export type SettingsOutletContext = {
  inputMode: TimerInputMode
  setInputMode: (mode: TimerInputMode) => void
  ganStatus: GanStatus
  connectGan: () => Promise<void>
  disconnectGan: () => void
}
