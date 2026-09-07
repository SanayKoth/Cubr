import { formatTime } from './format.ts'
import { parseManualTime } from './parseManualTime.ts'

function assertMs(raw: string, expected: number | null) {
  const actual = parseManualTime(raw)
  if (actual !== expected) {
    throw new Error(`parseManualTime(${JSON.stringify(raw)}): expected ${expected}, got ${actual}`)
  }
}

function assertDisplay(raw: string, shown: string) {
  const ms = parseManualTime(raw)
  if (ms === null) {
    throw new Error(`parseManualTime(${JSON.stringify(raw)}): expected a time, got null`)
  }
  const actual = formatTime(ms)
  if (actual !== shown) {
    throw new Error(`parseManualTime(${JSON.stringify(raw)}) display: expected ${shown}, got ${actual}`)
  }
}

export function verifyParseManualTime() {
  assertMs('1', 10)
  assertDisplay('1', '0.01')
  assertMs('12', 120)
  assertDisplay('12', '0.12')
  assertMs('856', 8560)
  assertDisplay('856', '8.56')
  assertMs('947', 9470)
  assertDisplay('947', '9.47')
  assertMs('12345', 123450)
  assertDisplay('12345', '2:03.45')

  assertMs('45', 450)
  assertDisplay('45', '0.45')
  assertMs('45.', 45000)
  assertDisplay('45.', '45.00')
  assertMs('45.00', 45000)

  assertMs('8.56', 8560)
  assertMs('8.5', 8500)
  assertMs('8.', 8000)
  assertMs('9.479', 9470)
  assertDisplay('9.479', '9.47')
  assertMs('1:05.43', 65430)
  assertMs('1:05', 65000)
  assertMs('1:5.00', 65000)
  assertMs('1:60.00', null)
  assertMs('.56', null)
  assertMs('8.56+', null)
  assertMs('DNF', null)

  assertMs('  856  ', 8560)
  assertMs('8 56', null)
  assertMs('', null)
  assertMs('   ', null)
}

verifyParseManualTime()
console.log('parseManualTime examples: all passed')
