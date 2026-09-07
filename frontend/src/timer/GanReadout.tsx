import type { InspectionCue } from './types'

type GanReadoutProps = {
  connected: boolean
  running: boolean
  inspecting: boolean
  inspectionCue: InspectionCue
  personalBest?: boolean
  clickable: boolean
  onButton: () => void
  readoutRef: (node: HTMLDivElement | null) => void
}

function ganTone(
  connected: boolean,
  running: boolean,
  inspecting: boolean,
  cue: InspectionCue,
): string {
  if (!connected) return 'text-text-dim'
  if (running) return 'text-text'
  if (inspecting) {
    if (cue >= 12) return 'text-accent'
    if (cue >= 8) return 'text-text'
    return 'text-text-dim'
  }
  return 'text-text'
}

export default function GanReadout({
  connected,
  running,
  inspecting,
  inspectionCue,
  clickable,
  onButton,
  readoutRef,
}: GanReadoutProps) {
  const phase = !connected ? 'disconnected' : running ? 'running' : inspecting ? 'inspecting' : 'idle'

  return (
    <div
      ref={readoutRef}
      role="timer"
      data-gan-readout
      data-phase={phase}
      onClick={() => {
        if (!clickable) return
        onButton()
      }}
      className={`timer-figures origin-center font-sans text-timer transition-transform duration-500 ease-out motion-reduce:transition-none ${
        running ? 'scale-[1.12]' : 'scale-100'
      } ${ganTone(connected, running, inspecting, inspectionCue)} ${
        clickable ? 'cursor-pointer' : ''
      }`}
    />
  )
}
