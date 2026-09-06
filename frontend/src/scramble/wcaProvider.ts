import { randomScrambleForEvent } from 'cubing/scramble'
import type { ScrambleProvider } from './provider'
import type { Scramble } from './types'

/*
  The only cubing.js import in the app. randomScrambleForEvent is the official
  random-state entry point; Alg.toString() is WCA notation. We do not import
  the 3D player, the package barrel, or the CDN — those would pull visualization
  code or break offline use.
*/
export const wcaProvider: ScrambleProvider = {
  async getNext(event: string): Promise<Scramble> {
    const alg = await randomScrambleForEvent(event)
    return {
      event,
      scrambleType: 'WCA',
      moves: alg.toString(),
    }
  },
}
