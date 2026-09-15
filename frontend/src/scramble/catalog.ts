import { SCRAMBLE_TYPES, type ScrambleType } from './types'

export const THREE_BY_THREE_EVENTS = ['333', '333oh', '333bf', '333fm'] as const

export type ScrambleTypeGroup = {
  label: string
  types: readonly ScrambleType[]
}

export const SCRAMBLE_TYPE_GROUPS: readonly ScrambleTypeGroup[] = [
  { label: 'WCA', types: ['WCA'] },
  { label: 'CFOP', types: ['F2L', 'OLL', 'PLL', 'ZBLL'] },
  { label: 'Roux', types: ['CMLL', 'L6E'] },
]

export function isThreeByThreeEvent(event: string): boolean {
  return (THREE_BY_THREE_EVENTS as readonly string[]).includes(event)
}

export function isScrambleType(value: string): value is ScrambleType {
  return (SCRAMBLE_TYPES as readonly string[]).includes(value)
}

export function normalizeScrambleType(value: string): ScrambleType {
  return isScrambleType(value) ? value : 'WCA'
}

export function allowedTypes(event: string): readonly ScrambleType[] {
  return isThreeByThreeEvent(event) ? SCRAMBLE_TYPES : (['WCA'] as const)
}

export function typeGroupsForEvent(event: string): ScrambleTypeGroup[] {
  const allowed = new Set<string>(allowedTypes(event))
  return SCRAMBLE_TYPE_GROUPS.map((group) => ({
    label: group.label,
    types: group.types.filter((type) => allowed.has(type)),
  })).filter((group) => group.types.length > 0)
}

export function scrambleTypeLabel(type: ScrambleType): string {
  return type
}

export function coerceScrambleType(event: string, type: string): ScrambleType {
  const normalized = normalizeScrambleType(type)
  return allowedTypes(event).includes(normalized) ? normalized : 'WCA'
}

/*
  cubing.js experimentalStickering key for the 3D preview.
  WCA uses the default full cube (no subset mask). Scramble code never
  imports cubing/twisty — the preview applies this string.
*/
export function stickeringFor(type: ScrambleType): string | null {
  return type === 'WCA' ? null : type
}
