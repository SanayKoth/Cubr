import ollJson from './data/oll.json' with { type: 'json' }
import pllJson from './data/pll.json' with { type: 'json' }
import type { AlgCase, AlgSetId } from './types'

const PLL = pllJson as AlgCase[]
const OLL = ollJson as AlgCase[]

export function casesForSet(set: AlgSetId): AlgCase[] {
  return set === 'oll' ? OLL : PLL
}

export function parseAlgSet(value: string | undefined): AlgSetId {
  return value === 'oll' ? 'oll' : 'pll'
}
