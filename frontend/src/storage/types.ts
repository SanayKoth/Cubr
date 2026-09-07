import type { Penalty } from '../api/types'

export type MetaRecord = {
  key: string
  id: string
}

export type StoredSession = {
  id: string
  name: string
  event: string
  scrambleType: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type StoredSolve = {
  id: string
  sessionId: string
  timeMs: number
  penalty: Penalty
  scramble: string | null
  timestamp: string
  updatedAt: string
  deletedAt: string | null
}

export type SyncQueueKind = 'session' | 'solve' | 'delete-solve'

export type SessionSyncPayload = {
  id: string
  name: string
  event: string
}

export type SolveSyncPayload = {
  sessionId: string
  id: string
  timeMs: number
  scramble: string
  timestamp: string
  penalty: Penalty
}

export type DeleteSolvePayload = {
  solveId: string
}

export type SyncPayload = SessionSyncPayload | SolveSyncPayload | DeleteSolvePayload

export type SyncQueueItem = {
  id: string
  kind: SyncQueueKind
  payload: SyncPayload
  createdAt: string
  attempts: number
  lastError: string | null
}
