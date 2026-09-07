import { createSession, createSolve, deleteSolve } from '../api/client'
import { isApiError } from '../api/errors'
import { db } from '../storage/db'
import type {
  DeleteSolvePayload,
  SessionSyncPayload,
  SolveSyncPayload,
  SyncQueueItem,
} from '../storage/types'

const BACKOFF_MS = [1000, 5000, 15000, 30000, 60000] as const

let running = false
let started = false
let cooldownUntil = 0
let timer: ReturnType<typeof setTimeout> | null = null
let onOnline: (() => void) | null = null

function backoffMs(attempts: number): number {
  return BACKOFF_MS[Math.min(Math.max(attempts - 1, 0), BACKOFF_MS.length - 1)]
}

function schedule(delayMs: number) {
  if (timer !== null) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    void tick()
  }, delayMs)
}

function isDeletePayload(payload: SyncQueueItem['payload']): payload is DeleteSolvePayload {
  return 'solveId' in payload
}

function isSolvePayload(payload: SyncQueueItem['payload']): payload is SolveSyncPayload {
  return 'sessionId' in payload && 'scramble' in payload
}

function isSessionPayload(payload: SyncQueueItem['payload']): payload is SessionSyncPayload {
  return 'name' in payload && 'event' in payload && !('sessionId' in payload)
}

async function replay(item: SyncQueueItem) {
  if (item.kind === 'session' && isSessionPayload(item.payload)) {
    await createSession({
      id: item.payload.id,
      name: item.payload.name,
      event: item.payload.event,
    })
    return
  }
  if (item.kind === 'solve' && isSolvePayload(item.payload)) {
    await createSolve(item.payload.sessionId, {
      id: item.payload.id,
      timeMs: item.payload.timeMs,
      scramble: item.payload.scramble,
      timestamp: item.payload.timestamp,
      penalty: item.payload.penalty,
    })
    return
  }
  if (item.kind === 'delete-solve' && isDeletePayload(item.payload)) {
    await deleteSolve(item.payload.solveId)
    return
  }
  throw new Error(`Unknown outbox item ${item.kind}`)
}

async function processHead(): Promise<boolean> {
  const wait = cooldownUntil - Date.now()
  if (wait > 0) {
    schedule(wait)
    return false
  }
  const item = await db.syncQueue.orderBy('createdAt').first()
  if (!item) return false

  try {
    await replay(item)
    await db.syncQueue.delete(item.id)
    return true
  } catch (error) {
    const status = isApiError(error) ? error.status : 0
    if (item.kind === 'delete-solve' && status === 404) {
      await db.syncQueue.delete(item.id)
      return true
    }

    const attempts = item.attempts + 1
    const message = error instanceof Error ? error.message : 'sync failed'

    /*
      Fix A: a solve 404 means its session is not on the server yet. Retrying
      the head forever wedges the session POST behind it. Move this solve to
      the end and let the next item run. If nothing else is queued, back off.
    */
    if (item.kind === 'solve' && status === 404) {
      await db.syncQueue.update(item.id, {
        createdAt: new Date().toISOString(),
        attempts,
        lastError: message,
      })
      const next = await db.syncQueue.orderBy('createdAt').first()
      if (next !== undefined && next.id !== item.id) {
        return true
      }
    } else {
      await db.syncQueue.update(item.id, { attempts, lastError: message })
      if (status >= 400 && status < 500) {
        console.error('Outbox item rejected', item.kind, status, message)
      }
    }

    cooldownUntil = Date.now() + backoffMs(attempts)
    schedule(backoffMs(attempts))
    return false
  }
}

async function tick() {
  if (running || !started) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  running = true
  try {
    while (started) {
      const progressed = await processHead()
      if (!progressed) break
    }
  } finally {
    running = false
  }
}

export function wakeSyncProcessor() {
  cooldownUntil = 0
  if (!started) return
  schedule(0)
}

export function startSyncProcessor() {
  if (started) {
    wakeSyncProcessor()
    return
  }
  started = true
  onOnline = () => wakeSyncProcessor()
  window.addEventListener('online', onOnline)
  void tick()
}

export function stopSyncProcessor() {
  started = false
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
  if (onOnline) {
    window.removeEventListener('online', onOnline)
    onOnline = null
  }
}
