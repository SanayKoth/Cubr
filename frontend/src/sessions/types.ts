import type { Solve } from '../solves/types'

export type Session = {
  id: string
  name: string
  event: string
  createdAt: string
  solves: Solve[]
}

export type SessionPanel = 'none' | 'switcher' | 'create' | 'event'
