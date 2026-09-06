import { useCallback, useState } from 'react'
import type { Penalty } from '../api/types'
import { CURRENT_EVENT } from '../scramble/types'
import type { Scramble } from '../scramble/types'
import { useScramble } from '../scramble/useScramble'
import { formatTime } from '../timer/format'
import type { InspectionCue, TimerPhase, TimerResult } from '../timer/types'
import { useTimer } from '../timer/useTimer'
import { useTimerKeyboard } from '../timer/useTimerKeyboard'

const INSPECTION_STORAGE_KEY = 'cubr.inspection'

type RecordedSolve = {
  result: TimerResult
  scramble: Scramble | null
}

function readInspectionEnabled(): boolean {
  try {
    return window.localStorage.getItem(INSPECTION_STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function writeInspectionEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(INSPECTION_STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // private mode / blocked storage — toggle still works for this session
  }
}

function readoutTone(phase: TimerPhase, cue: InspectionCue): string {
  if (phase === 'holding') return 'text-text-dim'
  if (phase === 'ready') return 'text-accent'
  if (phase === 'inspecting') {
    if (cue >= 12) return 'text-accent'
    if (cue >= 8) return 'text-text'
    return 'text-text-dim'
  }
  return 'text-text'
}

function penaltyLabel(penalty: Penalty): string {
  if (penalty === 'PLUS_TWO') return '+2'
  if (penalty === 'DNF') return 'DNF'
  return ''
}

function canRegenerate(phase: TimerPhase): boolean {
  return phase === 'idle' || phase === 'stopped'
}

export default function TimerPage() {
  const [inspectionEnabled, setInspectionEnabled] = useState(readInspectionEnabled)
  const [solves, setSolves] = useState<RecordedSolve[]>([])
  const { current: scramble, consume } = useScramble(CURRENT_EVENT)

  const recordSolve = useCallback(
    (result: TimerResult) => {
      const shown = consume()
      setSolves((current) => [...current, { result, scramble: shown }])
    },
    [consume],
  )

  const { phase, inspectionCue, readoutRef, press, release, cancel } = useTimer({
    inspectionEnabled,
    onSolve: recordSolve,
  })

  useTimerKeyboard({ phase, press, release, cancel })

  const toggleInspection = () => {
    const next = !inspectionEnabled
    writeInspectionEnabled(next)
    setInspectionEnabled(next)
    if (
      !next &&
      (phase === 'inspecting' || phase === 'holding' || phase === 'ready')
    ) {
      cancel()
    }
  }

  const regenerateAllowed = canRegenerate(phase)

  return (
    <main className="min-h-full bg-bg p-8 font-sans text-text select-none">
      <header className="flex items-center gap-8">
        <h1 className="shrink-0 font-brand text-3xl text-text">Cubr</h1>

        <button
          type="button"
          title="next scramble"
          aria-label="next scramble"
          disabled={!regenerateAllowed}
          onClick={() => {
            if (regenerateAllowed) consume()
          }}
          data-scramble={scramble ? 'ready' : 'pending'}
          className="min-w-0 flex-1 text-left text-xl text-text-dim select-text disabled:cursor-default"
        >
          {scramble ? scramble.moves : 'generating…'}
        </button>
      </header>

      {/* Provisional placement — relocates into the real top bar in Step 5. */}
      <button
        type="button"
        tabIndex={-1}
        onClick={toggleInspection}
        className={`mt-4 text-sm ${inspectionEnabled ? 'text-accent' : 'text-text-muted'}`}
      >
        inspection: {inspectionEnabled ? 'on' : 'off'}
      </button>

      <div
        ref={readoutRef}
        role="timer"
        data-phase={phase}
        className={`timer-figures mt-16 font-sans text-timer ${readoutTone(phase, inspectionCue)}`}
      />

      {/*
        THROW AWAY in Step 4. In-memory only — no persistence, no API.
        Shows the scramble that belonged to each solve, not the promoted next.
      */}
      {solves.length > 0 && (
        <ol className="mt-16 list-decimal pl-6 text-sm text-text-dim">
          {solves.map((solve, index) => {
            const tag = penaltyLabel(solve.result.penalty)
            return (
              <li key={`${solve.result.timeMs}-${index}`}>
                {formatTime(solve.result.timeMs)}
                {tag ? ` ${tag}` : ''}
                {solve.result.penalty !== 'NONE' ? ` (${solve.result.penalty})` : ''}
                {solve.scramble ? ` — ${solve.scramble.moves}` : ''}
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}
