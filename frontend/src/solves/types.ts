import type { Penalty } from '../api/types'

/*
  In-memory solve only. listId is a page-local key for React, not a client UUID —
  Step 7 introduces real IDs and a delete model (hard delete is fine until then).
*/
export type Solve = {
  listId: number
  timeMs: number
  penalty: Penalty
  scrambleMoves: string | null
}
