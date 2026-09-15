export const SCRAMBLE_TYPES = [
  'WCA',
  'F2L',
  'OLL',
  'PLL',
  'ZBLL',
  'CMLL',
  'L6E',
] as const

export type ScrambleType = (typeof SCRAMBLE_TYPES)[number]

export type Scramble = {
  event: string
  scrambleType: ScrambleType
  moves: string
}
