import { randomScrambleForEvent } from 'cubing/scramble'
import { setSearchDebug } from 'cubing/search'
import type { ScrambleProvider } from './provider'
import type { Scramble } from './types'

// Vite hashes search-worker-entry.js. cubing's first guess is the unhashed
// name, which 404s. Prefer the import.meta.url fallback that sees the hash.
setSearchDebug({
  prioritizeEsbuildWorkaroundForWorkerInstantiation: true,
})

/*
  cubing/scramble and cubing/search are the only cubing.js imports on the timer
  path. randomScrambleForEvent is the official random-state entry point;
  Alg.toString() is WCA notation. We do not import the 3D player, the package
  barrel, or the CDN — those would pull visualization code or break offline use.
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
