import type { Scramble, ScrambleType } from './types'

/*
  Callers ask for the next scramble for an event and type.
  Subset types are random-state patterns solved via cubing/search;
  WCA still uses randomScrambleForEvent.
*/
export interface ScrambleProvider {
  getNext(event: string, scrambleType: ScrambleType): Promise<Scramble>
}
