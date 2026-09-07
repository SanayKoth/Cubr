import { isRemoteSyncEnabled } from '../api/client'
import { wakeSyncProcessor } from '../sync/processor'
import { db } from './db'
import { isPersistenceEnabled, writeOnce } from './repository'
import type {
  DeleteSolvePayload,
  SessionSyncPayload,
  SolveSyncPayload,
  StoredSolve,
  SyncQueueItem,
  SyncQueueKind,
  SyncPayload,
} from './types'

const BACKFILL_KEY = 'outboxBackfillV2'

export function hasPostableScramble(scramble: string | null): scramble is string {
  return typeof scramble === 'string' && scramble.trim().length > 0
}

async function enqueue(kind: SyncQueueKind, payload: SyncPayload) {
  if (!isPersistenceEnabled() || !isRemoteSyncEnabled()) return
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  }
  await writeOnce('outbox', async () => {
    await db.syncQueue.add(item)
  })
  wakeSyncProcessor()
}

export async function enqueueSession(payload: SessionSyncPayload) {
  await enqueue('session', payload)
}

export async function enqueueSolve(payload: SolveSyncPayload) {
  if (!hasPostableScramble(payload.scramble)) return
  await enqueue('solve', payload)
}

export async function enqueueDeleteSolve(solveId: string) {
  const payload: DeleteSolvePayload = { solveId }
  await enqueue('delete-solve', payload)
}

export function solvePayloadFromRow(row: StoredSolve): SolveSyncPayload | null {
  if (!hasPostableScramble(row.scramble)) return null
  return {
    sessionId: row.sessionId,
    id: row.id,
    timeMs: row.timeMs,
    scramble: row.scramble,
    timestamp: row.timestamp,
    penalty: row.penalty,
  }
}

let backfillGate: Promise<void> | null = null

async function runBackfill() {
  if (!isPersistenceEnabled()) return
  const flag = await db.meta.get(BACKFILL_KEY)
  if (flag) return

  const sessions = (await db.sessions.toArray()).filter((session) => session.deletedAt == null)
  for (const session of sessions) {
    await enqueueSession({ id: session.id, name: session.name, event: session.event })
  }

  const solves = (await db.solves.toArray())
    .filter((solve) => solve.deletedAt == null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  for (const solve of solves) {
    const payload = solvePayloadFromRow(solve)
    if (payload) await enqueueSolve(payload)
  }

  await db.meta.put({ key: BACKFILL_KEY, id: 'done' })
}

export async function backfillOutboxIfNeeded() {
  if (!backfillGate) {
    backfillGate = runBackfill().catch((error) => {
      backfillGate = null
      console.error('IndexedDB outbox backfill failed', error)
    })
  }
  await backfillGate
}
