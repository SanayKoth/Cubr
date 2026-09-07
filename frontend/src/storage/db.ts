import Dexie, { type Table } from 'dexie'
import type { MetaRecord, StoredSession, StoredSolve } from './types'

/*
  Dexie schema v1. Bump the version and add a new stores() block when columns
  change — do not edit this v1 definition in place.
*/
export class CubrDB extends Dexie {
  meta!: Table<MetaRecord, string>
  sessions!: Table<StoredSession, string>
  solves!: Table<StoredSolve, string>

  constructor() {
    super('cubr')
    this.version(1).stores({
      meta: 'key',
      sessions: 'id, updatedAt',
      solves: 'id, sessionId, [sessionId+timestamp], deletedAt',
    })
  }
}

export const db = new CubrDB()
