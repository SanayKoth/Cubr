import type { ScrambleType } from '../scramble/types'
import type { Solve } from '../solves/types'

export type Session = {
  id: string
  name: string
  event: string
  scrambleType: ScrambleType
  createdAt: string
  updatedAt: string
  solves: Solve[]
}

export type SessionPanel = 'none' | 'switcher' | 'create' | 'event' | 'type'
