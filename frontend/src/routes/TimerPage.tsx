import { useCallback, useEffect, useRef, useState } from 'react'
import { useScramble } from '../scramble/useScramble'
import EventTypeBar from '../sessions/EventTypeBar'
import SessionPanel from '../sessions/SessionPanel'
import type { SessionPanel as Panel } from '../sessions/types'
import { useSessions } from '../sessions/useSessions'
import SolveList from '../solves/SolveList'
import type { InspectionCue, TimerPhase, TimerResult } from '../timer/types'
import { useTimer } from '../timer/useTimer'
import { useTimerKeyboard } from '../timer/useTimerKeyboard'

const INSPECTION_STORAGE_KEY = 'cubr.inspection'

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

function canRegenerate(phase: TimerPhase): boolean {
  return phase === 'idle' || phase === 'stopped'
}

export default function TimerPage() {
  const [inspectionEnabled, setInspectionEnabled] = useState(readInspectionEnabled)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [panel, setPanel] = useState<Panel>('none')
  const solveScrollRef = useRef<HTMLElement>(null)
  const {
    sessions,
    active,
    switchTo,
    addSession,
    setEvent,
    setScrambleType,
    appendSolve,
    setPenalty,
    deleteSolve,
  } = useSessions()
  const { current: scramble, consume } = useScramble(active.event)

  useEffect(() => {
    solveScrollRef.current?.scrollTo({ top: 0 })
  }, [active.solves.length])

  const recordSolve = useCallback(
    (result: TimerResult) => {
      const shown = consume()
      appendSolve({
        timeMs: result.timeMs,
        penalty: result.penalty,
        scrambleMoves: shown?.moves ?? null,
      })
      setSelectedId(null)
    },
    [appendSolve, consume],
  )

  const { phase, inspectionCue, readoutRef, press, release, cancel } = useTimer({
    inspectionEnabled,
    onSolve: recordSolve,
  })

  const pressAndDismiss = useCallback(() => {
    setSelectedId(null)
    setPanel('none')
    press()
  }, [press])

  const cancelAndDismiss = useCallback(() => {
    setSelectedId(null)
    if ((phase === 'idle' || phase === 'stopped') && panel !== 'none') {
      setPanel('none')
      return
    }
    setPanel('none')
    cancel()
  }, [cancel, panel, phase])

  useTimerKeyboard({
    phase,
    press: pressAndDismiss,
    release,
    cancel: cancelAndDismiss,
  })

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('[data-solve-list]')) return
      if (event.target.closest('[data-session-ui]')) return
      if (event.target.closest('[data-session-create]')) return
      if (event.target.closest('[data-scramble-meta]')) return
      setSelectedId(null)
      setPanel('none')
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const toggleInspection = () => {
    const next = !inspectionEnabled
    writeInspectionEnabled(next)
    setInspectionEnabled(next)
    if (
      !next &&
      (phase === 'inspecting' || phase === 'holding' || phase === 'ready')
    ) {
      cancelAndDismiss()
    }
  }

  const regenerateAllowed = canRegenerate(phase)

  return (
    <main className="relative flex h-full flex-col bg-bg font-sans text-text select-none md:block">
      <h1 className="px-6 pt-6 font-brand text-3xl text-text md:absolute md:top-6 md:left-6 md:z-20 md:p-0">
        Cubr
      </h1>

      <div className="px-6 pt-6 md:absolute md:top-28 md:left-6 md:z-20 md:w-56 md:p-0">
        <SessionPanel
          sessions={sessions}
          active={active}
          panel={panel}
          onPanel={setPanel}
          onSwitch={(id) => {
            switchTo(id)
            setSelectedId(null)
          }}
          onCreate={(name, event, scrambleType) => {
            addSession(name, event, scrambleType)
            setSelectedId(null)
          }}
        />
      </div>

      <header className="px-6 pt-4 text-center md:absolute md:inset-x-0 md:top-6 md:z-10 md:px-56 md:pt-1">
        <button
          type="button"
          title="next scramble"
          aria-label="next scramble"
          disabled={!regenerateAllowed}
          onClick={() => {
            if (regenerateAllowed) consume()
          }}
          data-scramble={scramble ? 'ready' : 'pending'}
          className="max-w-5xl text-center text-xl leading-snug text-text-dim select-text disabled:cursor-default md:text-2xl"
        >
          {scramble ? scramble.moves : 'generating…'}
        </button>
        <EventTypeBar
          active={active}
          panel={panel}
          onPanel={setPanel}
          onChangeEvent={setEvent}
          onChangeType={setScrambleType}
        />
      </header>

      <section className="relative flex flex-1 items-center justify-center md:absolute md:inset-0">
        <div
          ref={readoutRef}
          role="timer"
          data-phase={phase}
          className={`timer-figures font-sans text-timer ${readoutTone(phase, inspectionCue)}`}
        />

        <button
          type="button"
          tabIndex={-1}
          data-inspection
          onClick={toggleInspection}
          className={`absolute right-6 bottom-6 text-sm ${
            inspectionEnabled ? 'text-accent' : 'text-text-muted'
          }`}
        >
          inspection: {inspectionEnabled ? 'on' : 'off'}
        </button>
      </section>

      <aside
        ref={solveScrollRef}
        className="max-h-[32vh] overflow-y-auto overscroll-contain px-6 pb-6 md:absolute md:top-auto md:right-auto md:bottom-8 md:left-6 md:z-10 md:max-h-[40vh] md:w-56 md:px-0 md:pb-0"
      >
        <SolveList
          solves={active.solves}
          selectedId={selectedId}
          onSelect={(listId) =>
            setSelectedId((current) => (current === listId ? null : listId))
          }
          onSetPenalty={setPenalty}
          onDelete={(listId) => {
            deleteSolve(listId)
            setSelectedId(null)
          }}
        />
        {/* Stats reserved for Step 6. Empty on purpose — no fake numbers. */}
        <div data-stats-slot className="min-h-20" />
      </aside>
    </main>
  )
}
