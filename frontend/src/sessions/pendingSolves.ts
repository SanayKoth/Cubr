import type { NewSolve, Solve } from '../solves/types'

/*
  Module-level so a pre-ready solve survives React Strict Mode remounting
  useSessions. The page can keep timing during hydrate; these land on the
  active session once it exists.
*/
const pending: NewSolve[] = []

export function bufferPreReadySolve(entry: NewSolve) {
  pending.push(entry)
}

export function takePreReadySolves(): NewSolve[] {
  return pending.splice(0, pending.length)
}

export function buildSolve(entry: NewSolve): Solve {
  return {
    id: crypto.randomUUID(),
    timeMs: entry.timeMs,
    penalty: entry.penalty,
    scramble: entry.scramble,
    timestamp: new Date().toISOString(),
  }
}
