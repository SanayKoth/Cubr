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
import { formatSolveTime } from '../solves/format'
import { averageOfN, bestSingle } from '../stats/engine'
import { formatStat } from '../stats/format'
import StatsBlock from '../stats/StatsBlock'
import ManualReadout from '../timer/ManualReadout'
import GanReadout from '../timer/GanReadout'
import type { InspectionCue, TimerPhase, TimerResult } from '../timer/types'
import { useGanTimer } from '../timer/useGanTimer'
import { useTimer } from '../timer/useTimer'
import { useTimerKeyboard } from '../timer/useTimerKeyboard'
import { useTimerPointer } from '../timer/useTimerPointer'
import { useInspectionAlert } from '../timer/useInspectionAlert'

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
  const [sheetOpen, setSheetOpen] = useState(false)
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

  const {
    status: ganStatus,
    running: ganRunning,
    inspecting: ganInspecting,
    inspectionCue: ganInspectionCue,
    connect: connectGanDevice,
    disconnect: disconnectGan,
    onButton: pressGanButton,
    cancelInspection: cancelGanInspection,
    setReadoutRef: setGanReadoutRef,
  } = useGanTimer({
    onStop: (timeMs) => recordSolve({ timeMs, penalty: 'NONE' }),
  })

  const setInputMode = useCallback(
    (mode: TimerInputMode) => {
      if (mode !== 'gan') disconnectGan()
      writeTimerInputMode(mode)
      setInputModeState(mode)
    },
    [disconnectGan],
  )

  const connectGan = useCallback(async () => {
    const ok = await connectGanDevice()
    if (!ok) return
    writeTimerInputMode('gan')
    setInputModeState('gan')
  }, [connectGanDevice])

  const pressAndDismiss = useCallback(() => {
    setSelectedId(null)
    setPanel('none')
    setSheetOpen(false)
    press()
  }, [press])

  const cancelAndDismiss = useCallback(() => {
    setSelectedId(null)
    setSheetOpen(false)
    if ((phase === 'idle' || phase === 'stopped') && panel !== 'none') {
      setPanel('none')
      return
    }
    setPanel('none')
    cancel()
  }, [cancel, panel, phase])

  const pointerEnabled = !settingsOpen && inputMode === 'keyboard'

  useTimerKeyboard({
    phase,
    press: pressAndDismiss,
    release,
    cancel: cancelAndDismiss,
    enabled: pointerEnabled,
  })

  useTimerPointer({
    press: pressAndDismiss,
    release,
    enabled: pointerEnabled,
  })

  const inspectFlash = useInspectionAlert(
    inputMode === 'gan' ? ganInspectionCue : inspectionCue,
  )

  useEffect(() => {
    if (settingsOpen || inputMode !== 'gan') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelGanInspection()
        return
      }
      if (event.repeat || event.code !== 'Space') return
      if (event.target instanceof HTMLInputElement) return
      if (ganRunning) return
      event.preventDefault()
      pressGanButton()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [
    cancelGanInspection,
    ganRunning,
    inputMode,
    pressGanButton,
    settingsOpen,
  ])

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
      if (event.target.closest('[data-times-sheet]')) return
      if (event.target.closest('[data-session-affordance]')) return
      if (event.target.closest('[data-times-affordance]')) return
      setSelectedId(null)
      setPanel('none')
      setSheetOpen(false)
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

  const regenerateAllowed = canRegenerate(phase) && !ganRunning && !ganInspecting
  const outletContext: SettingsOutletContext = {
    inputMode,
    setInputMode,
    ganStatus,
    connectGan,
    disconnectGan,
  }
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
  const focus = phase === 'running' || ganRunning
  const best = bestSingle(active?.solves ?? [])
  const pbMs = best.kind === 'numeric' ? best.ms : null
  const lastSolve = active?.solves.at(-1) ?? null
  const ao5 = averageOfN(active?.solves ?? [], 5)
  const chrome = focus
    ? 'pointer-events-none opacity-0 transition-opacity duration-500 ease-out'
    : 'opacity-100 transition-opacity duration-500 ease-out'

  return (
    <main
      data-ready={ready ? 'true' : 'false'}
      data-pre-ready-flushed={String(preReadyFlushed)}
      data-input-mode={inputMode}
      data-gan-status={ganStatus}
      data-timer-focus={focus ? 'true' : 'false'}
      className="relative flex h-full flex-col bg-bg font-sans text-text select-none md:block"
    >
      <h1
        className={`absolute top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] z-20 font-brand text-xl text-text md:top-6 md:left-6 md:text-3xl ${chrome}`}
      >
        Cubr
      </h1>

      <Link
        to="/settings"
        aria-label="settings"
        data-settings
        aria-hidden={focus}
        tabIndex={focus ? -1 : undefined}
        className={`absolute top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-20 flex size-12 items-center justify-center text-text outline-none md:top-5 md:right-5 ${chrome}`}
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

      {sheetOpen && (
        <div
          data-times-backdrop
          aria-hidden
          className="fixed inset-0 z-[25] bg-bg/80 md:hidden"
        />
      )}

      <div
        data-times-sheet
        className={`${
          sheetOpen
            ? 'fixed inset-x-0 bottom-0 z-30 flex max-h-[min(80vh,calc(100dvh-env(safe-area-inset-top)-2rem))] min-h-0 flex-col border-t border-border bg-bg px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] touch-auto'
            : 'hidden'
        } md:absolute md:inset-auto md:top-28 md:bottom-8 md:left-6 md:z-20 md:flex md:max-h-none md:w-56 md:flex-col md:border-0 md:bg-transparent md:p-0 md:touch-auto ${chrome}`}
      >
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
        <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-border pt-3">
          <div
            ref={solveScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
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
        </div>
      </div>

      {active && (
        <div
          className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] z-20 flex flex-col items-start gap-1 md:hidden ${chrome}`}
        >
          <button
            type="button"
            data-session-affordance
            onClick={() => setSheetOpen(true)}
            className="max-w-[10rem] truncate text-sm text-text-dim"
          >
            {active.name}
          </button>
          <button
            type="button"
            data-times-affordance
            onClick={() => setSheetOpen(true)}
            className="text-sm text-text-dim"
          >
            {lastSolve
              ? formatSolveTime(lastSolve.timeMs, lastSolve.penalty)
              : 'times'}
          </button>
        </div>
      )}

      <header
        className={`px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.25rem))] text-center md:absolute md:inset-x-0 md:top-6 md:z-10 md:px-56 md:pt-1 ${chrome}`}
      >
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

      <section
        className={`relative flex flex-1 items-center justify-center pb-32 md:absolute md:inset-0 md:pb-0 ${
          inputMode === 'keyboard' ? 'touch-none' : ''
        }`}
      >
        <div className="flex flex-col items-center">
          {inputMode === 'manual' ? (
            <ManualReadout
              paused={settingsOpen}
              onRecord={(timeMs) => recordSolve({ timeMs, penalty: 'NONE' })}
            />
          ) : inputMode === 'gan' ? (
            <GanReadout
              connected={ganStatus === 'connected'}
              running={ganRunning}
              inspecting={ganInspecting}
              inspectionCue={ganInspectionCue}
              personalBest={false}
              clickable={ganStatus === 'connected' && !ganRunning}
              onButton={pressGanButton}
              readoutRef={setGanReadoutRef}
            />
          ) : (
            <div
              ref={setReadoutRef}
              role="timer"
              data-phase={phase}
              className={`timer-figures origin-center font-sans text-timer transition-transform duration-500 ease-out motion-reduce:transition-none ${
                focus ? 'scale-[1.12]' : 'scale-100'
              } ${readoutTone(phase, inspectionCue)}`}
            />
          )}
          <p
            data-ao5
            className={`mt-3 text-base ${chrome}`}
          >
            <span className="text-text-muted">ao5</span>
            <span
              data-stat="ao5-glance"
              className="ml-2 font-sans text-text-dim timer-figures"
            >
              {formatStat(ao5)}
            </span>
          </p>
        </div>
      </section>

      <div
        className={`absolute right-[max(1.25rem,env(safe-area-inset-right))] bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-end gap-2 md:right-5 md:bottom-5 ${chrome}`}
      >
        {preview && (
          <div className="h-20 w-20 md:h-44 md:w-44">
            <Suspense fallback={null}>
              <ScramblePreview event={preview.event} moves={preview.moves} />
            </Suspense>
          </div>
        )}
        {inputMode !== 'gan' && (
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
        )}
      </div>

      <Outlet context={outletContext} />

      {inspectFlash !== null && (
        <div
          data-inspection-alert={inspectFlash}
          className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center bg-accent/20 animate-inspect-flash"
        >
          <span className="font-sans text-timer text-accent timer-figures scale-[2.2]">
            {inspectFlash}
          </span>
        </div>
      )}
    </main>
  )
}
