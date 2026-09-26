export type AlgSetId = 'pll' | 'oll'

export type AlgCase = {
  id: string
  name: string
  group?: string
  algs: string[]
}

export const ALG_SETS: { id: AlgSetId; label: string }[] = [
  { id: 'oll', label: 'OLL' },
  { id: 'pll', label: 'PLL' },
]

export const OLL_GROUPS = [
  'Dot',
  'Square',
  'Lightning',
  'Fish',
  'Knight',
  'All edges',
  'All corners',
  'Awkward',
  'P',
  'T',
  'C',
  'W',
  'L',
  'Line',
] as const

export type OllGroup = (typeof OLL_GROUPS)[number]
