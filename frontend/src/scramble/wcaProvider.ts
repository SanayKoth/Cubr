import { randomScrambleForEvent } from 'cubing/scramble'
import { setSearchDebug } from 'cubing/search'
import { coerceScrambleType } from './catalog'
import type { ScrambleProvider } from './provider'
import { generateSubsetScramble } from './subsets'
import type { Scramble, ScrambleType } from './types'

// Vite hashes search-worker-entry.js. cubing's first guess is the unhashed
// name, which 404s. Prefer the import.meta.url fallback that sees the hash.
setSearchDebug({
  prioritizeEsbuildWorkaroundForWorkerInstantiation: true,
})

/*
  cubing/scramble, cubing/search, cubing/puzzles, and cubing/kpuzzle are the
  cubing.js imports on the scramble path. Stickering is a string in catalog.ts;
  the 3D preview applies experimentalStickering and is the only cubing/twisty
  import. Do not import cubing/twisty from here.
*/
export const wcaProvider: ScrambleProvider = {
  async getNext(event: string, scrambleType: ScrambleType): Promise<Scramble> {
    const type = coerceScrambleType(event, scrambleType)
    if (type === 'WCA') {
      const alg = await randomScrambleForEvent(event)
      return {
        event,
        scrambleType: 'WCA',
        moves: alg.toString(),
      }
    }
    return {
      event,
      scrambleType: type,
      moves: await generateSubsetScramble(type),
    }
  },
}
