import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import AppDock from '../nav/AppDock'
import { stickeringFor } from '../scramble/catalog'
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
import InspectionTrack from '../timer/InspectionTrack'

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
    active?.scrambleType ?? 'WCA',
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
      if (event.target.closest('[data-scramble-picker]')) return
      if (event.target.closest('[data-scramble-nav]')) return
      if (event.target.closest('[data-scramble-preview]')) return
      if (event.target.closest('[data-settings]')) return
      if (event.target.closest('[data-algs]')) return
      if (event.target.closest('[data-app-dock]')) return
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
    stickering: string | null
  } | null>(null)
  if (
    scramble &&
    (heldPreview?.event !== scramble.event ||
      heldPreview.moves !== scramble.moves ||
      heldPreview.stickering !== stickeringFor(scramble.scrambleType))
  ) {
    setHeldPreview({
      event: scramble.event,
      moves: scramble.moves,
      stickering: stickeringFor(scramble.scrambleType),
    })
  }
  const preview = scramble
    ? {
        event: scramble.event,
        moves: scramble.moves,
        stickering: stickeringFor(scramble.scrambleType),
      }
    : heldPreview
  const focus = phase === 'running' || ganRunning
  const inspectLive =
    ganInspecting ||
    phase === 'inspecting' ||
    (inspectionEnabled &&
      inputMode === 'keyboard' &&
      (phase === 'holding' || phase === 'ready'))
  const hideChrome = focus || inspectLive
  const best = bestSingle(active?.solves ?? [])
  const pbMs = best.kind === 'numeric' ? best.ms : null
  const lastSolve = active?.solves.at(-1) ?? null
  const ao5 = averageOfN(active?.solves ?? [], 5)
  const chrome = hideChrome
    ? 'pointer-events-none opacity-0 transition-opacity duration-500 ease-out'
    : 'opacity-100 transition-opacity duration-500 ease-out'

  return (
    <main
      data-ready={ready ? 'true' : 'false'}
      data-pre-ready-flushed={String(preReadyFlushed)}
      data-input-mode={inputMode}
      data-gan-status={ganStatus}
      data-timer-focus={hideChrome ? 'true' : 'false'}
      className="relative flex h-full flex-col bg-bg font-sans text-text select-none md:block"
    >
      <h1
        className={`absolute top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] z-20 font-brand text-xl text-text md:top-6 md:left-6 md:text-3xl ${chrome}`}
      >
        Cubr
      </h1>

      <AppDock
        hidden={hideChrome}
        leading={
          active ? (
            <button
              type="button"
              data-session-affordance
              data-times-affordance
              aria-expanded={sheetOpen}
              aria-label={sheetOpen ? 'close session' : 'open session'}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setSheetOpen((open) => !open)}
              className={`glass-dock relative z-[60] flex items-center gap-2 rounded-2xl px-3 py-1.5 touch-manipulation transition-[transform,background-color,border-color] duration-150 ease-out active:scale-95 ${
                sheetOpen ? 'border-text/20 bg-text/10' : 'active:bg-text/8'
              }`}
            >
              <span className="flex min-w-0 flex-col items-start text-left">
                <span className="text-[11px] tracking-wide text-text-muted">session</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="max-w-[5.5rem] truncate text-sm text-text">{active.name}</span>
                  <span className="text-sm text-text-dim timer-figures">
                    {lastSolve
                      ? formatSolveTime(lastSolve.timeMs, lastSolve.penalty)
                      : '—'}
                  </span>
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-text/10 text-text-dim transition-transform duration-200 ease-out ${
                  sheetOpen ? 'rotate-180 bg-text/15 text-text' : ''
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" className="size-4">
                  <path
                    d="M6 14l6-6 6 6"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          ) : null
        }
      />

      {sheetOpen && (
        <div
          data-times-backdrop
          aria-hidden
          className="fixed inset-0 z-[25] bg-bg/50 md:hidden"
        />
      )}

      <div
        data-times-sheet
        className={`${
          sheetOpen
            ? 'fixed z-30 flex min-h-0 flex-col touch-auto max-md:inset-x-[max(1rem,env(safe-area-inset-left))] max-md:right-[max(1rem,env(safe-area-inset-right))] max-md:bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.25rem))] max-md:max-h-[min(62vh,calc(100dvh-8.5rem))] max-md:overflow-hidden max-md:rounded-3xl max-md:px-4 max-md:pt-3 max-md:pb-3 max-md:glass-dock'
            : 'hidden'
        } md:absolute md:inset-auto md:top-28 md:bottom-60 md:left-6 md:z-20 md:flex md:max-h-none md:w-56 md:flex-col md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0 md:touch-auto ${chrome}`}
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
        <div className="mt-3 flex min-h-0 flex-1 flex-col max-md:border-t max-md:border-text/8 md:border-t md:border-border pt-3">
          <div
            ref={solveScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain max-md:max-h-[min(36vh,18rem)]"
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
          className="mt-2 flex items-center justify-center gap-6 text-sm"
        >
          <button
            type="button"
            data-scramble-back
            disabled={!regenerateAllowed || !canGoBack}
            onClick={() => {
              if (regenerateAllowed) back()
            }}
            className="inline-flex min-h-11 min-w-14 items-center justify-center px-3 text-text-dim disabled:text-text-muted disabled:cursor-default"
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
            className="inline-flex min-h-11 min-w-14 items-center justify-center px-3 text-text-dim disabled:text-text-muted disabled:cursor-default"
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
          <div className="relative">
            {inspectLive && <InspectionTrack />}
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
                className={`relative z-10 timer-figures origin-center font-sans text-timer transition-transform duration-500 ease-out motion-reduce:transition-none ${
                  focus ? 'scale-[1.12]' : 'scale-100'
                } ${readoutTone(phase, inspectionCue)}`}
              />
            )}
          </div>
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
        className={`absolute bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.25rem))] left-[max(1.25rem,env(safe-area-inset-left))] z-10 flex flex-col items-start gap-2 md:right-5 md:bottom-5 md:left-auto md:items-end ${chrome}`}
      >
        {preview && (
          <div className="h-20 w-20 md:h-44 md:w-44">
            <Suspense fallback={null}>
              <ScramblePreview
                event={preview.event}
                moves={preview.moves}
                stickering={preview.stickering}
              />
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
