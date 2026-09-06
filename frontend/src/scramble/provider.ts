import type { Scramble } from './types'

/*
  The extension point for 2.0. 1.0 has one implementation (WCA random-state).
  An OLL/PLL provider later satisfies this same contract. Callers ask for the
  next scramble for an event and do not know how it was produced.
*/
export interface ScrambleProvider {
  getNext(event: string): Promise<Scramble>
}
