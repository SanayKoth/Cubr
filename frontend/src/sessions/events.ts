export const WCA_EVENTS = [
  { id: '333', label: '3x3' },
  { id: '222', label: '2x2' },
  { id: '444', label: '4x4' },
  { id: '555', label: '5x5' },
  { id: '666', label: '6x6' },
  { id: '777', label: '7x7' },
  { id: '333oh', label: 'OH' },
  { id: '333bf', label: 'BLD' },
  { id: '333fm', label: 'FMC' },
  { id: 'minx', label: 'Mega' },
  { id: 'pyram', label: 'Pyra' },
  { id: 'skewb', label: 'Skewb' },
  { id: 'sq1', label: 'SQ1' },
  { id: 'clock', label: 'Clock' },
] as const

export type WcaEventId = (typeof WCA_EVENTS)[number]['id']

export function eventLabel(event: string): string {
  return WCA_EVENTS.find((entry) => entry.id === event)?.label ?? event
}
