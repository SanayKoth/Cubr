import type { Penalty } from '../api/types'
import type { ScrambleType } from '../scramble/types'
import type { Session } from '../sessions/types'
import type { Solve } from '../solves/types'
import { writeActiveSessionId } from './activeSession'
import { db } from './db'
import type { StoredSession, StoredSolve } from './types'

let persistenceEnabled = true

export function isPersistenceEnabled(): boolean {
  return persistenceEnabled
}

function disablePersistence(reason: unknown) {
  persistenceEnabled = false
  console.warn('IndexedDB unavailable, using in-memory sessions', reason)
}

export async function writeOnce(label: string, operation: () => Promise<void>) {
  if (!persistenceEnabled) return
  try {
    await operation()
  } catch {
    try {
      await operation()
    } catch (error) {
      console.error(`IndexedDB write failed (${label})`, error)
    }
  }
}

export function toStoredSession(session: Session): StoredSession {
  return {
    id: session.id,
    name: session.name,
    event: session.event,
    scrambleType: session.scrambleType,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    deletedAt: null,
  }
}

export function toStoredSolve(sessionId: string, solve: Solve, updatedAt: string): StoredSolve {
  return {
    id: solve.id,
    sessionId,
    timeMs: solve.timeMs,
    penalty: solve.penalty,
    scramble: solve.scramble,
    timestamp: solve.timestamp,
    updatedAt,
    deletedAt: null,
  }
}

function toSession(row: StoredSession, solves: StoredSolve[]): Session {
  return {
    id: row.id,
    name: row.name,
    event: row.event,
    scrambleType: row.scrambleType as ScrambleType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    solves: solves.map((solve) => ({
      id: solve.id,
      timeMs: solve.timeMs,
      penalty: solve.penalty,
      scramble: solve.scramble,
      timestamp: solve.timestamp,
    })),
  }
}

export async function ensureClientId(): Promise<string | null> {
  if (!persistenceEnabled) return null
  try {
    const existing = await db.meta.get('clientId')
    if (existing?.id) return existing.id
    const id = crypto.randomUUID()
    await db.meta.put({ key: 'clientId', id })
    return id
  } catch (error) {
    disablePersistence(error)
    return null
  }
}

export async function loadLiveSessions(): Promise<Session[] | null> {
  if (!persistenceEnabled) return null
  try {
    const rows = (await db.sessions.toArray())
      .filter((session) => session.deletedAt == null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

    const sessions: Session[] = []
    for (const row of rows) {
      const solves = (await db.solves.where('sessionId').equals(row.id).toArray())
        .filter((solve) => solve.deletedAt == null)
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      sessions.push(toSession(row, solves))
    }
    return sessions
  } catch (error) {
    disablePersistence(error)
    return null
  }
}

export async function persistSession(session: Session) {
  await writeOnce('session', async () => {
    await db.sessions.put(toStoredSession(session))
  })
}

export async function persistSolve(sessionId: string, solve: Solve) {
  const now = new Date().toISOString()
  await writeOnce('solve', async () => {
    await db.solves.put(toStoredSolve(sessionId, solve, now))
  })
}

export async function persistSolvePenalty(id: string, penalty: Penalty) {
  const now = new Date().toISOString()
  await writeOnce('penalty', async () => {
    await db.solves.update(id, { penalty, updatedAt: now })
  })
}

export async function persistSolveDeleted(id: string) {
  const now = new Date().toISOString()
  await writeOnce('delete-solve', async () => {
    await db.solves.update(id, { deletedAt: now, updatedAt: now })
  })
}

export async function persistActiveId(id: string) {
  writeActiveSessionId(id)
}

export function pickActiveId(sessions: Session[], preferredId: string | null): string {
  if (preferredId && sessions.some((session) => session.id === preferredId)) {
    return preferredId
  }
  return sessions[0].id
}
