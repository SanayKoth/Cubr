export type AlgSetId = 'pll' | 'oll'

export type AlgCase = {
  id: string
  name: string
  group?: string
  algs: string[]
}

export const ALG_SETS: { id: AlgSetId; label: string }[] = [
  { id: 'pll', label: 'PLL' },
  { id: 'oll', label: 'OLL' },
]
