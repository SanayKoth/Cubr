import type { Penalty } from '../api/types'

/*
  Live solve row. Soft-deleted solves stay in IndexedDB and never appear here.
  id is the client UUID (also what Step 8 will send). timeMs is always raw.
*/
export type Solve = {
  id: string
  timeMs: number
  penalty: Penalty
  scramble: string | null
  timestamp: string
}

export type NewSolve = {
  timeMs: number
  penalty: Penalty
  scramble: string | null
}
