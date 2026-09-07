/*
  Parse a typed time into WCA-truncated milliseconds (centiseconds).
  Integer math only — never float the result.
  null means reject (do not record, do not consume the scramble).
*/
export function parseManualTime(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  if (/\s/.test(trimmed)) return null

  if (/^\d+$/.test(trimmed)) {
    const centiseconds = parseNonNegInt(trimmed)
    if (centiseconds === null) return null
    return centiseconds * 10
  }

  if (trimmed.includes('.') || trimmed.includes(':')) {
    return parseClock(trimmed)
  }

  return null
}

function parseNonNegInt(digits: string): number | null {
  if (digits.length === 0 || digits.length > 10) return null
  let value = 0
  for (let i = 0; i < digits.length; i += 1) {
    const digit = digits.charCodeAt(i) - 48
    if (digit < 0 || digit > 9) return null
    value = value * 10 + digit
  }
  return value
}

function parseFracToCs(frac: string): number | null {
  if (frac.length > 0 && !/^\d+$/.test(frac)) return null
  const tens = frac.length > 0 ? frac.charCodeAt(0) - 48 : 0
  const ones = frac.length > 1 ? frac.charCodeAt(1) - 48 : 0
  return tens * 10 + ones
}

function parseSecondsAndFrac(part: string): { sec: number; cs: number } | null {
  const dot = part.indexOf('.')
  if (dot === -1) {
    if (!/^\d+$/.test(part)) return null
    const sec = parseNonNegInt(part)
    if (sec === null) return null
    return { sec, cs: 0 }
  }

  if (part.indexOf('.', dot + 1) !== -1) return null
  const secStr = part.slice(0, dot)
  const fracStr = part.slice(dot + 1)
  if (secStr.length === 0 || !/^\d+$/.test(secStr)) return null
  const sec = parseNonNegInt(secStr)
  const cs = parseFracToCs(fracStr)
  if (sec === null || cs === null) return null
  return { sec, cs }
}

function parseClock(trimmed: string): number | null {
  const colonCount = trimmed.split(':').length - 1
  if (colonCount > 1) return null

  let minutes = 0
  let rest = trimmed

  if (colonCount === 1) {
    const colon = trimmed.indexOf(':')
    const minStr = trimmed.slice(0, colon)
    rest = trimmed.slice(colon + 1)
    if (!/^\d+$/.test(minStr)) return null
    const parsedMin = parseNonNegInt(minStr)
    if (parsedMin === null) return null
    minutes = parsedMin
  }

  const parsed = parseSecondsAndFrac(rest)
  if (parsed === null) return null

  if (colonCount === 1) {
    const secStr = rest.includes('.') ? rest.slice(0, rest.indexOf('.')) : rest
    if (secStr.length < 1 || secStr.length > 2) return null
    if (parsed.sec > 59) return null
  }

  const totalCs = minutes * 6000 + parsed.sec * 100 + parsed.cs
  return totalCs * 10
}
