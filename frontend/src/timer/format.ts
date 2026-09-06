/*
  WCA Regulation 9f: truncate down to the nearest 0.01s. 9.479 displays as 9.47,
  never 9.48. Rounding would make every displayed time subtly wrong.
*/
export function formatTime(ms: number): string {
  const clamped = Math.max(0, ms)
  const totalCs = Math.floor(clamped / 10)
  const minutes = Math.floor(totalCs / 6000)
  const remainder = totalCs % 6000
  const seconds = Math.floor(remainder / 100)
  const centiseconds = remainder % 100
  const cs = centiseconds.toString().padStart(2, '0')

  if (minutes === 0) {
    return `${seconds}.${cs}`
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}.${cs}`
}

export function formatInspectionSeconds(elapsedMs: number): string {
  return String(Math.floor(Math.max(0, elapsedMs) / 1000))
}
