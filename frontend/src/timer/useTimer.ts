import { useCallback, useEffect, useRef, useState } from 'react'
import { formatInspectionSeconds, formatTime } from './format'
import {
  createInitialState,
  inspectionCueAt,
  needsAnimationFrame,
  onCancel,
  onHoldThreshold,
  onPress,
  onRelease,
} from './machine'
import type { TimerMachineState } from './machine'
import { HOLD_THRESHOLD_MS } from './types'
import type { InspectionCue, TimerPhase, UseTimerOptions } from './types'
import { playInspectionCue, warmInspectionSound } from './inspectionCueSound'

/*
  Headless timer. Knows nothing about sessions, layout, or the API client.
  Pages pass configuration in and receive results through onSolve.

  The running / inspecting digits are written straight to the readout DOM node
  inside a requestAnimationFrame loop. React state updates only on phase
  (and inspection-cue) changes — never per frame. That is what keeps the timer
  from feeling laggy.
*/

export function useTimer({ inspectionEnabled, onSolve }: UseTimerOptions) {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [inspectionCue, setInspectionCue] = useState<InspectionCue>(0)

  const readoutRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<TimerMachineState>(createInitialState())
  const lastTimeMsRef = useRef(0)
  const rafIdRef = useRef<number | null>(null)
  const cueRef = useRef<InspectionCue>(0)

  const inspectionEnabledRef = useRef(inspectionEnabled)
  const onSolveRef = useRef(onSolve)

  useEffect(() => {
    inspectionEnabledRef.current = inspectionEnabled
  }, [inspectionEnabled])

  useEffect(() => {
    onSolveRef.current = onSolve
  }, [onSolve])

  const writeStatic = useCallback((timeMs: number) => {
    const el = readoutRef.current
    if (el) el.textContent = formatTime(timeMs)
  }, [])

  const setReadoutRef = useCallback((node: HTMLDivElement | null) => {
    readoutRef.current = node
    if (node) node.textContent = formatTime(lastTimeMsRef.current)
  }, [])

  const stopRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const paintFrame = useCallback((now: number) => {
    const state = stateRef.current
    const el = readoutRef.current
    if (!el) return

    if (state.phase === 'running' && state.runStart !== null) {
      el.textContent = formatTime(now - state.runStart)
      return
    }

    if (state.inspectStart !== null) {
      el.textContent = formatInspectionSeconds(now - state.inspectStart)
      const cue = inspectionCueAt(state.inspectStart, now)
      if (cue !== cueRef.current) {
        cueRef.current = cue
        if (cue === 8 || cue === 12) playInspectionCue(cue)
        setInspectionCue(cue)
      }
    }
  }, [])

  const startRaf = useCallback(() => {
    stopRaf()
    const loop = (now: number) => {
      paintFrame(now)
      rafIdRef.current = requestAnimationFrame(loop)
    }
    rafIdRef.current = requestAnimationFrame(loop)
  }, [paintFrame, stopRaf])

  const apply = useCallback(
    (next: TimerMachineState) => {
      const prev = stateRef.current
      if (next === prev) return
      stateRef.current = next

      if (prev.phase === 'running' && next.phase === 'stopped' && next.result) {
        lastTimeMsRef.current = next.result.timeMs
        onSolveRef.current(next.result)
        writeStatic(next.result.timeMs)
      }

      if (next.phase !== prev.phase) {
        if (next.phase === 'idle' || next.phase === 'stopped') {
          writeStatic(lastTimeMsRef.current)
          cueRef.current = 0
          setInspectionCue(0)
        }
        setPhase(next.phase)
      }

      if (needsAnimationFrame(next)) {
        paintFrame(performance.now())
        if (rafIdRef.current === null) startRaf()
      } else {
        stopRaf()
      }
    },
    [paintFrame, startRaf, stopRaf, writeStatic],
  )

  const press = useCallback(() => {
    warmInspectionSound()
    apply(onPress(stateRef.current, performance.now(), inspectionEnabledRef.current))
  }, [apply])

  const release = useCallback(() => {
    apply(onRelease(stateRef.current, performance.now(), inspectionEnabledRef.current))
  }, [apply])

  const cancel = useCallback(() => {
    apply(onCancel(stateRef.current))
  }, [apply])

  useEffect(() => {
    writeStatic(lastTimeMsRef.current)
  }, [writeStatic])

  useEffect(() => {
    if (phase !== 'holding') return
    const id = window.setTimeout(() => {
      apply(onHoldThreshold(stateRef.current))
    }, HOLD_THRESHOLD_MS)
    return () => window.clearTimeout(id)
  }, [phase, apply])

  useEffect(() => {
    return () => stopRaf()
  }, [stopRaf])

  return {
    phase,
    inspectionCue,
    readoutRef: setReadoutRef,
    press,
    release,
    cancel,
  }
}
