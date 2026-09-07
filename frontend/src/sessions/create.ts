import type { ScrambleType } from '../scramble/types'
import { defaultSessionName } from './events'
import type { Session } from './types'

export function createSession(
  name: string,
  event: string,
  scrambleType: ScrambleType = 'WCA',
): Session {
  const trimmed = name.trim()
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name: trimmed.length > 0 ? trimmed : defaultSessionName(event),
    event,
    scrambleType,
    createdAt: now,
    updatedAt: now,
    solves: [],
  }
}

export function createDefaultSession(): Session {
  return createSession(defaultSessionName('333'), '333', 'WCA')
}
