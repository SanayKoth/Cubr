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
