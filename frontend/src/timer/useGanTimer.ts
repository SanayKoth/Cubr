import { useCallback, useEffect, useRef, useState } from 'react'
import type { GanStatus } from '../settings/types'
import { formatInspectionSeconds, formatTime } from './format'
import { inspectionCueAt } from './machine'
import type { InspectionCue } from './types'

type GanDevice = EventTarget & {
  disconnect: () => void
  getTime: () => Promise<number>
}

type TimerDetail = {
  currentTime: number
}

type GanListeners = {
  start: () => void
  update: (event: Event) => void
  stop: (event: Event) => void
  reset: () => void
  disconnect: () => void
}

type NotifyChar = EventTarget & {
  stopNotifications: () => Promise<unknown>
}

type NotifyHandle = {
  char: NotifyChar
  listener: (event: Event) => void
}

type UseGanTimerOptions = {
  onStop: (timeMs: number) => void
}

const GAN_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb'
const GAN_STATE_CHAR = '0000fff5-0000-1000-8000-00805f9b34fb'
const STATE_RUNNING = 0x03
const STATE_STOPPED = 0x04
const STATE_IDLE = 0x05
const DISCONNECTED_READOUT = '-.--'

function truncateMs(ms: number): number {
  return Math.floor(ms / 10) * 10
}

function decodeTimeMs(bytes: Uint8Array): number {
  return (bytes[0] * 60 + bytes[1]) * 1000 + bytes[2] + bytes[3] * 256
}

function isTimerDetail(value: unknown): value is TimerDetail {
  if (typeof value !== 'object' || value === null) return false
  if (!('currentTime' in value)) return false
  return typeof value.currentTime === 'number'
}

function detailFromEvent(event: Event): TimerDetail | null {
  if (!('detail' in event)) return null
  return isTimerDetail(event.detail) ? event.detail : null
}

function bytesFromCharEvent(event: Event): Uint8Array | null {
  const target = event.target
  if (!(target instanceof EventTarget) || !('value' in target)) return null
  const view = target.value
  if (!(view instanceof DataView)) return null
  return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

function parseGanState(bytes: Uint8Array): { state: number; timeMs: number | null } | null {
  if (bytes.length < 4 || bytes[0] !== 0xfe || bytes[2] !== 0x01) return null
  const state = bytes[3]
  const timeMs = bytes[1] >= 8 && bytes.length >= 8 ? decodeTimeMs(bytes.subarray(4, 8)) : null
  return { state, timeMs }
}

function gattServerOf(timer: GanDevice): {
  getPrimaryService: (uuid: string) => Promise<{
    getCharacteristic: (uuid: string) => Promise<NotifyChar & { startNotifications: () => Promise<unknown> }>
  }>
} | null {
  if (!('server' in timer)) return null
  const server = timer.server
  if (typeof server !== 'object' || server === null) return null
  if (!('getPrimaryService' in server)) return null
  return server as {
    getPrimaryService: (uuid: string) => Promise<{
      getCharacteristic: (uuid: string) => Promise<NotifyChar & { startNotifications: () => Promise<unknown> }>
    }>
  }
}

export function useGanTimer({ onStop }: UseGanTimerOptions) {
  const [status, setStatus] = useState<GanStatus>('disconnected')
  const [running, setRunning] = useState(false)
  const [inspecting, setInspecting] = useState(false)
  const [inspectionCue, setInspectionCue] = useState<InspectionCue>(0)
  const [finishedMs, setFinishedMs] = useState(0)

  const timerRef = useRef<GanDevice | null>(null)
  const readoutRef = useRef<HTMLDivElement | null>(null)
  const shownMsRef = useRef(0)
  const modeRef = useRef<'time' | 'inspect'>('time')
  const runningRef = useRef(false)
  const inspectingRef = useRef(false)
  const inspectStartRef = useRef<number | null>(null)
  const runOriginRef = useRef(0)
  const cueRef = useRef<InspectionCue>(0)
  const rafIdRef = useRef<number | null>(null)
  const recordedThisRunRef = useRef(false)
  const onStopRef = useRef(onStop)
  const statusRef = useRef(status)
  const listenersRef = useRef<GanListeners | null>(null)
  const notifyRef = useRef<NotifyHandle | null>(null)
  const connectGenRef = useRef(0)
  const suppressInspectUntilRef = useRef(0)
  const apiRef = useRef({
    beginRun: (_source: 'notify' | 'poll') => {},
    finishRun: (_timeMs: number) => {},
    clearToZero: () => {},
    onButton: () => {},
  })

  useEffect(() => {
    onStopRef.current = onStop
  }, [onStop])

  const stopRaf = useCallback(() => {
    if (rafIdRef.current === null) return
    cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = null
  }, [])

  const writeTime = useCallback((ms: number) => {
    modeRef.current = 'time'
    shownMsRef.current = ms
    const el = readoutRef.current
    if (el) el.textContent = formatTime(ms)
  }, [])

  const writeDisconnected = useCallback(() => {
    modeRef.current = 'time'
    shownMsRef.current = 0
    const el = readoutRef.current
    if (el) el.textContent = DISCONNECTED_READOUT
  }, [])

  const writeInspect = useCallback((elapsedMs: number) => {
    modeRef.current = 'inspect'
    const el = readoutRef.current
    if (el) el.textContent = formatInspectionSeconds(elapsedMs)
    const start = inspectStartRef.current
    if (start === null) return
    const cue = inspectionCueAt(start, start + elapsedMs)
    if (cue !== cueRef.current) {
      cueRef.current = cue
      setInspectionCue(cue)
    }
  }, [])

  const setReadoutRef = useCallback((node: HTMLDivElement | null) => {
    readoutRef.current = node
    if (!node) return
    if (statusRef.current !== 'connected') {
      node.textContent = DISCONNECTED_READOUT
      return
    }
    if (modeRef.current === 'inspect' && inspectStartRef.current !== null) {
      node.textContent = formatInspectionSeconds(performance.now() - inspectStartRef.current)
      return
    }
    node.textContent = formatTime(shownMsRef.current)
  }, [])

  const paintFrame = useCallback(
    (now: number) => {
      if (runningRef.current) {
        writeTime(truncateMs(now - runOriginRef.current))
        return
      }
      if (inspectingRef.current && inspectStartRef.current !== null) {
        writeInspect(now - inspectStartRef.current)
      }
    },
    [writeInspect, writeTime],
  )

  const startRaf = useCallback(() => {
    stopRaf()
    const loop = (now: number) => {
      paintFrame(now)
      rafIdRef.current = requestAnimationFrame(loop)
    }
    rafIdRef.current = requestAnimationFrame(loop)
  }, [paintFrame, stopRaf])

  const cancelInspection = useCallback(() => {
    inspectingRef.current = false
    inspectStartRef.current = null
    cueRef.current = 0
    setInspecting(false)
    setInspectionCue(0)
    if (!runningRef.current) {
      stopRaf()
      writeTime(0)
    }
  }, [stopRaf, writeTime])

  const startInspection = useCallback(() => {
    if (runningRef.current) return
    if (statusRef.current !== 'connected') return
    if (shownMsRef.current > 0) return
    inspectingRef.current = true
    inspectStartRef.current = performance.now()
    cueRef.current = 0
    setInspecting(true)
    setInspectionCue(0)
    writeInspect(0)
    startRaf()
  }, [startRaf, writeInspect])

  const beginRun = useCallback((source: 'notify' | 'poll') => {
    if (runningRef.current) return
    // cubing.js often emits start+stop together when stored time jumps from 0 to
    // the finished result. That is not a new solve — FFF5 already recorded it.
    if (source === 'poll' && shownMsRef.current > 0) return
    runningRef.current = true
    recordedThisRunRef.current = false
    inspectingRef.current = false
    inspectStartRef.current = null
    cueRef.current = 0
    runOriginRef.current = performance.now()
    setRunning(true)
    setInspecting(false)
    setInspectionCue(0)
    writeTime(0)
    startRaf()
  }, [startRaf, writeTime])

  const finishRun = useCallback(
    (timeMs: number) => {
      const ms = truncateMs(timeMs)
      runningRef.current = false
      inspectingRef.current = false
      inspectStartRef.current = null
      stopRaf()
      writeTime(ms)
      setRunning(false)
      setInspecting(false)
      setInspectionCue(0)
      setFinishedMs(ms)
      if (recordedThisRunRef.current) return
      recordedThisRunRef.current = true
      onStopRef.current(ms)
    },
    [stopRaf, writeTime],
  )

  const clearToZero = useCallback(() => {
    runningRef.current = false
    inspectingRef.current = false
    inspectStartRef.current = null
    recordedThisRunRef.current = false
    cueRef.current = 0
    stopRaf()
    writeTime(0)
    setRunning(false)
    setInspecting(false)
    setInspectionCue(0)
    setFinishedMs(0)
  }, [stopRaf, writeTime])

  const onButton = useCallback(() => {
    if (statusRef.current !== 'connected') return
    if (runningRef.current) return
    if (inspectingRef.current || shownMsRef.current > 0) {
      clearToZero()
      return
    }
    startInspection()
  }, [clearToZero, startInspection])

  useEffect(() => {
    apiRef.current = { beginRun, finishRun, clearToZero, onButton }
  }, [beginRun, clearToZero, finishRun, onButton])

  const dropNotify = useCallback(() => {
    const handle = notifyRef.current
    notifyRef.current = null
    if (!handle) return
    handle.char.removeEventListener('characteristicvaluechanged', handle.listener)
    void handle.char.stopNotifications().catch(() => {})
  }, [])

  const ensureListeners = useCallback((): GanListeners => {
    const existing = listenersRef.current
    if (existing) return existing

    const listeners: GanListeners = {
      start: () => {
        apiRef.current.beginRun('poll')
      },
      update: (event: Event) => {
        const detail = detailFromEvent(event)
        if (!detail || !runningRef.current) return
        if (detail.currentTime <= 0) return
        runOriginRef.current = performance.now() - detail.currentTime
        writeTime(truncateMs(detail.currentTime))
      },
      stop: (event: Event) => {
        const detail = detailFromEvent(event)
        if (!detail) return
        apiRef.current.finishRun(detail.currentTime)
      },
      reset: () => {
        apiRef.current.clearToZero()
        suppressInspectUntilRef.current = performance.now() + 200
      },
      disconnect: () => {
        recordedThisRunRef.current = false
        timerRef.current = null
        runningRef.current = false
        inspectingRef.current = false
        inspectStartRef.current = null
        stopRaf()
        dropNotify()
        writeDisconnected()
        setRunning(false)
        setInspecting(false)
        setInspectionCue(0)
        statusRef.current = 'disconnected'
        setStatus('disconnected')
      },
    }
    listenersRef.current = listeners
    return listeners
  }, [dropNotify, stopRaf, writeDisconnected, writeTime])

  const attachStateNotify = useCallback(async (timer: GanDevice, gen: number) => {
    const server = gattServerOf(timer)
    if (!server) return
    try {
      const service = await server.getPrimaryService(GAN_SERVICE)
      const char = await service.getCharacteristic(GAN_STATE_CHAR)
      if (gen !== connectGenRef.current) return
      const listener = (event: Event) => {
        const bytes = bytesFromCharEvent(event)
        if (!bytes) return
        const parsed = parseGanState(bytes)
        if (!parsed) return
        if (parsed.state === STATE_RUNNING) {
          apiRef.current.beginRun('notify')
          return
        }
        if (parsed.state === STATE_STOPPED && parsed.timeMs !== null) {
          apiRef.current.finishRun(parsed.timeMs)
          return
        }
        if (parsed.state === STATE_IDLE) {
          if (performance.now() < suppressInspectUntilRef.current) return
          apiRef.current.onButton()
        }
      }
      await char.startNotifications()
      if (gen !== connectGenRef.current) {
        void char.stopNotifications().catch(() => {})
        return
      }
      char.addEventListener('characteristicvaluechanged', listener)
      notifyRef.current = { char, listener }
    } catch {
      // pad still records via cubing.js stop; live digits / logo-button inspect need this notify
    }
  }, [])

  const dropDevice = useCallback(() => {
    connectGenRef.current += 1
    runningRef.current = false
    inspectingRef.current = false
    inspectStartRef.current = null
    stopRaf()
    dropNotify()
    const timer = timerRef.current
    const listeners = listenersRef.current
    timerRef.current = null
    if (!timer || !listeners) return
    timer.removeEventListener('start', listeners.start)
    timer.removeEventListener('update', listeners.update)
    timer.removeEventListener('stop', listeners.stop)
    timer.removeEventListener('reset', listeners.reset)
    timer.removeEventListener('disconnect', listeners.disconnect)
    try {
      timer.disconnect()
    } catch {
      // already gone
    }
  }, [dropNotify, stopRaf])

  const connect = useCallback(async (): Promise<boolean> => {
    if (timerRef.current && statusRef.current === 'connected') return true
    if (statusRef.current === 'connecting') return false

    dropDevice()
    const gen = connectGenRef.current
    statusRef.current = 'connecting'
    setStatus('connecting')
    try {
      const { connectSmartTimer } = await import('cubing/bluetooth')
      const timer: GanDevice = await connectSmartTimer()
      if (gen !== connectGenRef.current) {
        try {
          timer.disconnect()
        } catch {
          // superseded
        }
        return false
      }
      const listeners = ensureListeners()
      timer.addEventListener('start', listeners.start)
      timer.addEventListener('update', listeners.update)
      timer.addEventListener('stop', listeners.stop)
      timer.addEventListener('reset', listeners.reset)
      timer.addEventListener('disconnect', listeners.disconnect)
      timerRef.current = timer
      statusRef.current = 'connected'
      setStatus('connected')
      writeTime(0)
      void attachStateNotify(timer, gen)
      return true
    } catch {
      timerRef.current = null
      setRunning(false)
      setInspecting(false)
      statusRef.current = 'disconnected'
      setStatus('disconnected')
      writeDisconnected()
      return false
    }
  }, [attachStateNotify, dropDevice, ensureListeners, writeDisconnected, writeTime])

  const disconnect = useCallback(() => {
    dropDevice()
    recordedThisRunRef.current = false
    setRunning(false)
    setInspecting(false)
    setInspectionCue(0)
    statusRef.current = 'disconnected'
    setStatus('disconnected')
    writeDisconnected()
  }, [dropDevice, writeDisconnected])

  useEffect(() => {
    return () => {
      dropDevice()
    }
  }, [dropDevice])

  return {
    status,
    running,
    inspecting,
    inspectionCue,
    finishedMs,
    connect,
    disconnect,
    onButton,
    cancelInspection,
    setReadoutRef,
  }
}
