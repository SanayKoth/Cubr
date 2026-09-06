export type ScrambleType = 'WCA'

export type Scramble = {
  event: string
  scrambleType: ScrambleType
  moves: string
}

/*
  Step 5 replaces this constant with session.event. The provider already takes
  an event argument; only the caller needs to change.
*/
export const CURRENT_EVENT = '333'
