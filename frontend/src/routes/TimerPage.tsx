import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, Outlet, useMatch } from 'react-router-dom'
import { useScramble } from '../scramble/useScramble'
import { readTimerInputMode, writeTimerInputMode } from '../settings/storage'
import type { SettingsOutletContext, TimerInputMode } from '../settings/types'
import EventTypeBar from '../sessions/EventTypeBar'
import SessionPanel from '../sessions/SessionPanel'
import type { SessionPanel as Panel } from '../sessions/types'
import { useSessions } from '../sessions/useSessions'
import { useSyncProcessor } from '../sync/useSyncProcessor'
import SolveList from '../solves/SolveList'
import { bestSingle, effectiveTime } from '../stats/engine'
import StatsBlock from '../stats/StatsBlock'
import ManualReadout from '../timer/ManualReadout'
import type { InspectionCue, TimerPhase, TimerResult } from '../timer/types'
import { useTimer } from '../timer/useTimer'
import { useTimerKeyboard } from '../timer/useTimerKeyboard'

const ScramblePreview = lazy(() => import('../preview/ScramblePreview'))

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

function readoutTone(
  phase: TimerPhase,
  cue: InspectionCue,
  personalBest: boolean,
): string {
  if (phase === 'holding') return 'text-text-dim'
  if (phase === 'ready') return 'text-accent'
  if (phase === 'inspecting') {
    if (cue >= 12) return 'text-accent'
    if (cue >= 8) return 'text-text'
    return 'text-text-dim'
  }
  if ((phase === 'stopped' || phase === 'idle') && personalBest) return 'text-accent'
  return 'text-text'
}

function canRegenerate(phase: TimerPhase): boolean {
  return phase === 'idle' || phase === 'stopped'
}

function isLivePhase(phase: TimerPhase): boolean {
  return (
    phase === 'inspecting' ||
    phase === 'holding' ||
    phase === 'ready' ||
    phase === 'running'
  )
}

export default function TimerPage() {
  const [inspectionEnabled, setInspectionEnabled] = useState(readInspectionEnabled)
  const [inputMode, setInputModeState] = useState<TimerInputMode>(readTimerInputMode)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>('none')
  const solveScrollRef = useRef<HTMLDivElement>(null)
  const settingsOpen = Boolean(useMatch('/settings'))
  const {
    ready,
    preReadyFlushed,
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
  useSyncProcessor(ready)
  const { current: scramble, consume, skip, back, canGoBack } = useScramble(
    active?.event ?? '333',
  )

  useEffect(() => {
    solveScrollRef.current?.scrollTo({ top: 0 })
  }, [active?.solves.length])

  const recordSolve = useCallback(
    (result: TimerResult) => {
      const shown = consume()
      appendSolve({
        timeMs: result.timeMs,
        penalty: result.penalty,
        scramble: shown?.moves ?? null,
      })
      setSelectedId(null)
    },
    [appendSolve, consume],
  )

  const { phase, inspectionCue, readoutRef: setReadoutRef, press, release, cancel } = useTimer({
    inspectionEnabled,
    onSolve: recordSolve,
  })

  const setInputMode = useCallback((mode: TimerInputMode) => {
    writeTimerInputMode(mode)
    setInputModeState(mode)
  }, [])

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
    enabled: !settingsOpen && inputMode === 'keyboard',
  })

  useEffect(() => {
    if (!settingsOpen && inputMode !== 'manual') return
    if (!isLivePhase(phase)) return
    cancel()
  }, [cancel, inputMode, phase, settingsOpen])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return
      if (event.target.closest('[data-solve-list]')) return
      if (event.target.closest('[data-session-ui]')) return
      if (event.target.closest('[data-session-create]')) return
      if (event.target.closest('[data-scramble-meta]')) return
      if (event.target.closest('[data-scramble-nav]')) return
      if (event.target.closest('[data-scramble-preview]')) return
      if (event.target.closest('[data-settings]')) return
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
  const outletContext: SettingsOutletContext = { inputMode, setInputMode }
  const [heldPreview, setHeldPreview] = useState<{
    event: string
    moves: string
  } | null>(null)
  if (
    scramble &&
    (heldPreview?.event !== scramble.event || heldPreview.moves !== scramble.moves)
  ) {
    setHeldPreview({ event: scramble.event, moves: scramble.moves })
  }
  const preview = scramble
    ? { event: scramble.event, moves: scramble.moves }
    : heldPreview
  const focus = phase === 'running'
  const best = bestSingle(active?.solves ?? [])
  const pbMs = best.kind === 'numeric' ? best.ms : null
  const lastSolve = active?.solves.at(-1)
  const lastTime = lastSolve ? effectiveTime(lastSolve) : null
  const stoppedPb =
    (phase === 'stopped' || phase === 'idle') &&
    lastTime?.kind === 'numeric' &&
    lastTime.ms === pbMs
  const chrome = focus
    ? 'pointer-events-none opacity-0 transition-opacity duration-500 ease-out'
    : 'opacity-100 transition-opacity duration-500 ease-out'

  return (
    <main
      data-ready={ready ? 'true' : 'false'}
      data-pre-ready-flushed={String(preReadyFlushed)}
      data-input-mode={inputMode}
      data-timer-focus={focus ? 'true' : 'false'}
      className="relative flex h-full flex-col bg-bg font-sans text-text select-none md:block"
    >
      <h1 className={`px-6 pt-6 font-brand text-3xl text-text md:absolute md:top-6 md:left-6 md:z-20 md:p-0 ${chrome}`}>
        Cubr
      </h1>

      <Link
        to="/settings"
        aria-label="settings"
        aria-hidden={focus}
        tabIndex={focus ? -1 : undefined}
        className={`absolute top-5 right-5 z-20 flex size-12 items-center justify-center text-text outline-none ${chrome}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-7"
        >
          <path
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.75"
          />
        </svg>
      </Link>

      <div className={`px-6 pt-6 md:absolute md:top-28 md:left-6 md:z-20 md:w-56 md:p-0 ${chrome}`}>
        {active && (
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
        )}
      </div>

      <header className={`px-6 pt-4 text-center md:absolute md:inset-x-0 md:top-6 md:z-10 md:px-56 md:pt-1 ${chrome}`}>
        <button
          type="button"
          title="next scramble"
          aria-label="next scramble"
          disabled={!regenerateAllowed}
          onClick={() => {
            if (regenerateAllowed) skip()
          }}
          data-scramble={scramble ? 'ready' : 'pending'}
          className="max-w-5xl text-center text-xl leading-snug text-text-dim select-text disabled:cursor-default md:text-2xl"
        >
          {scramble ? scramble.moves : 'generating…'}
        </button>
        <div
          data-scramble-nav
          className="mt-2 flex items-start justify-center gap-6 text-sm"
        >
          <button
            type="button"
            data-scramble-back
            disabled={!regenerateAllowed || !canGoBack}
            onClick={() => {
              if (regenerateAllowed) back()
            }}
            className="text-text-dim disabled:text-text-muted disabled:cursor-default"
          >
            last
          </button>
          {active && (
            <EventTypeBar
              active={active}
              panel={panel}
              onPanel={setPanel}
              onChangeEvent={setEvent}
              onChangeType={setScrambleType}
            />
          )}
          <button
            type="button"
            data-scramble-next
            disabled={!regenerateAllowed}
            onClick={() => {
              if (regenerateAllowed) skip()
            }}
            className="text-text-dim disabled:text-text-muted disabled:cursor-default"
          >
            next
          </button>
        </div>
      </header>

      <section className="relative flex flex-1 items-center justify-center md:absolute md:inset-0">
        {inputMode === 'manual' ? (
          <ManualReadout
            paused={settingsOpen}
            onRecord={(timeMs) => recordSolve({ timeMs, penalty: 'NONE' })}
          />
        ) : (
          <div
            ref={setReadoutRef}
            role="timer"
            data-phase={phase}
            className={`timer-figures origin-center font-sans text-timer transition-transform duration-500 ease-out motion-reduce:transition-none ${
              focus ? 'scale-[1.12]' : 'scale-100'
            } ${readoutTone(phase, inspectionCue, stoppedPb)}`}
          />
        )}
      </section>

      <aside className={`flex max-h-[50vh] flex-col px-6 pb-48 md:absolute md:top-auto md:right-auto md:bottom-8 md:left-6 md:z-10 md:max-h-[62vh] md:w-56 md:px-0 md:pb-0 ${chrome}`}>
        <div
          ref={solveScrollRef}
          className="min-h-0 flex-auto overflow-y-auto overscroll-contain"
        >
          {active && (
            <SolveList
              solves={active.solves}
              selectedId={selectedId}
              personalBestMs={pbMs}
              onSelect={(id) =>
                setSelectedId((current) => (current === id ? null : id))
              }
              onSetPenalty={setPenalty}
              onDelete={(id) => {
                deleteSolve(id)
                setSelectedId(null)
              }}
            />
          )}
        </div>
        {active && <StatsBlock solves={active.solves} />}
      </aside>

      <div className={`absolute right-5 bottom-5 z-10 flex flex-col items-end gap-2 ${chrome}`}>
        {preview && (
          <div className="h-32 w-32 md:h-44 md:w-44">
            <Suspense fallback={null}>
              <ScramblePreview event={preview.event} moves={preview.moves} />
            </Suspense>
          </div>
        )}
        <button
          type="button"
          tabIndex={-1}
          data-inspection
          onClick={toggleInspection}
          className={`text-sm ${
            inspectionEnabled ? 'text-accent' : 'text-text-muted'
          }`}
        >
          inspection: {inspectionEnabled ? 'on' : 'off'}
        </button>
      </div>

      <Outlet context={outletContext} />
    </main>
  )
}
