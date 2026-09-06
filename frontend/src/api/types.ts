/*
  API types — these MIRROR the backend DTOs exactly. Do not loosen them to make
  something compile; the type system is the reviewer here. If the backend
  contract changes, change these to match, never the other way around.
*/

export type Penalty = 'NONE' | 'PLUS_TWO' | 'DNF'

export type SessionResponse = {
  id: string
  name: string
  event: string
  createdAt: string
}

export type CreateSessionRequest = {
  id: string
  name: string
  event: string
}

export type SolveResponse = {
  id: string
  sessionId: string
  timeMs: number
  scramble: string
  timestamp: string
  penalty: Penalty
}

export type CreateSolveRequest = {
  id: string
  timeMs: number
  scramble: string
  timestamp: string
  penalty?: Penalty
}

export type ErrorResponse = {
  status: number
  error: string
  message: string
  path: string
}
