import Dexie, { type Table } from 'dexie'
import type { MetaRecord, StoredSession, StoredSolve, SyncQueueItem } from './types'

/*
  Dexie schema. v1 stays frozen. v2 adds the outbox; existing store strings
  are repeated so Dexie does not drop those tables.
*/
export class CubrDB extends Dexie {
  meta!: Table<MetaRecord, string>
  sessions!: Table<StoredSession, string>
  solves!: Table<StoredSolve, string>
  syncQueue!: Table<SyncQueueItem, string>

  constructor() {
    super('cubr')
    this.version(1).stores({
      meta: 'key',
      sessions: 'id, updatedAt',
      solves: 'id, sessionId, [sessionId+timestamp], deletedAt',
    })
    this.version(2).stores({
      meta: 'key',
      sessions: 'id, updatedAt',
      solves: 'id, sessionId, [sessionId+timestamp], deletedAt',
      syncQueue: 'id, createdAt, kind',
    })
  }
}

export const db = new CubrDB()
