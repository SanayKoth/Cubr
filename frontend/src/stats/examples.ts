import { formatTime } from '../timer/format.ts'
import {
  averageOfN,
  bestAverageOfN,
  bestSingle,
  computeSessionStats,
  effectiveTime,
  sessionMean,
} from './engine.ts'
import type { StatValue, TimedSolve } from './types.ts'

function solve(timeMs: number, penalty: TimedSolve['penalty'] = 'NONE'): TimedSolve {
  return { timeMs, penalty }
}

function seconds(value: number): number {
  return value * 1000
}

function display(value: StatValue): string {
  if (value.kind === 'blank') return '—'
  if (value.kind === 'dnf') return 'DNF'
  return formatTime(value.ms)
}

function assertStat(label: string, actual: StatValue, expected: StatValue) {
  if (actual.kind !== expected.kind) {
    throw new Error(`${label}: expected ${expected.kind}, got ${JSON.stringify(actual)}`)
  }
  if (actual.kind === 'numeric' && expected.kind === 'numeric' && actual.ms !== expected.ms) {
    throw new Error(`${label}: expected ${expected.ms}ms, got ${actual.ms}ms`)
  }
}

function assertDisplay(label: string, actual: StatValue, expected: string) {
  const shown = display(actual)
  if (shown !== expected) {
    throw new Error(`${label}: expected display ${expected}, got ${shown}`)
  }
}

function assertTrue(label: string, condition: boolean) {
  if (!condition) throw new Error(label)
}

export function verifyAverages() {
  const plusTwo = effectiveTime(solve(8000, 'PLUS_TWO'))
  assertTrue('+2 is numeric', plusTwo.kind === 'numeric')
  assertTrue('+2 adds 2000ms at read time', plusTwo.kind === 'numeric' && plusTwo.ms === 10000)
  assertTrue('+2 does not treat stored 8000 as 8.00', plusTwo.kind === 'numeric' && plusTwo.ms !== 8000)
  assertTrue('DNF is a sentinel, not a number', effectiveTime(solve(8000, 'DNF')).kind === 'dnf')

  const ao5A = [
    solve(seconds(8)),
    solve(seconds(9)),
    solve(seconds(10)),
    solve(seconds(11)),
    solve(seconds(12)),
  ]
  assertStat('Ao5 A', averageOfN(ao5A, 5), { kind: 'numeric', ms: seconds(10) })
  assertDisplay('Ao5 A display', averageOfN(ao5A, 5), '10.00')

  const ao5B = [
    solve(seconds(8)),
    solve(seconds(9)),
    solve(seconds(10)),
    solve(seconds(11)),
    solve(seconds(12), 'DNF'),
  ]
  assertStat('Ao5 B one DNF dropped as worst', averageOfN(ao5B, 5), {
    kind: 'numeric',
    ms: seconds(10),
  })

  const ao5C = [
    solve(seconds(8)),
    solve(seconds(9)),
    solve(seconds(10)),
    solve(seconds(11), 'DNF'),
    solve(seconds(12), 'DNF'),
  ]
  assertStat('Ao5 C two DNF', averageOfN(ao5C, 5), { kind: 'dnf' })
  assertDisplay('Ao5 C display', averageOfN(ao5C, 5), 'DNF')

  const ao5D = [
    solve(9479),
    solve(seconds(9)),
    solve(seconds(10)),
    solve(seconds(11)),
    solve(seconds(12)),
  ]
  assertTrue('9.479 single truncates for display only', formatTime(9479) === '9.47')
  const ao5DResult = averageOfN(ao5D, 5)
  assertTrue(
    'Ao5 D math uses 9479ms, not the displayed 9470ms',
    ao5DResult.kind === 'numeric' && ao5DResult.ms === 30479 / 3,
  )
  assertDisplay('Ao5 D display truncates, does not round', ao5DResult, '10.15')

  const plusTwoSolve = solve(8000, 'PLUS_TWO')
  const ao5E = [
    solve(seconds(10)),
    plusTwoSolve,
    solve(seconds(10)),
    solve(seconds(10)),
    solve(seconds(10)),
  ]
  assertStat('Ao5 E +2 among tens', averageOfN(ao5E, 5), { kind: 'numeric', ms: seconds(10) })
  assertTrue('Ao5 E stored timeMs is still raw 8000', plusTwoSolve.timeMs === 8000)

  const withPlusTwo = [
    solve(seconds(7)),
    solve(seconds(8)),
    solve(seconds(9)),
    solve(8000, 'PLUS_TWO'),
    solve(seconds(11)),
  ]
  const withoutPlusTwo = [
    solve(seconds(7)),
    solve(seconds(8)),
    solve(seconds(9)),
    solve(8000),
    solve(seconds(11)),
  ]
  assertStat('Ao5 +2 proof: 8000+PLUS_TWO enters as 10.00', averageOfN(withPlusTwo, 5), {
    kind: 'numeric',
    ms: seconds(9),
  })
  assertStat(
    'Ao5 +2 proof: raw 8000 would drop 7 and 11 then mean 8, 9, 8',
    averageOfN(withoutPlusTwo, 5),
    { kind: 'numeric', ms: 25000 / 3 },
  )
  const withPlusTwoResult = averageOfN(withPlusTwo, 5)
  const withoutPlusTwoResult = averageOfN(withoutPlusTwo, 5)
  assertTrue(
    'Ao5 +2 proof: 9.00 !== 8.33 if +2 was ignored',
    withPlusTwoResult.kind === 'numeric' &&
      withoutPlusTwoResult.kind === 'numeric' &&
      withPlusTwoResult.ms !== withoutPlusTwoResult.ms,
  )

  const ao12OneDnf = [
    ...Array.from({ length: 11 }, () => solve(seconds(10))),
    solve(seconds(10), 'DNF'),
  ]
  assertStat('Ao12 one DNF', averageOfN(ao12OneDnf, 12), { kind: 'numeric', ms: seconds(10) })

  const ao12TwoDnf = [
    ...Array.from({ length: 10 }, () => solve(seconds(10))),
    solve(seconds(10), 'DNF'),
    solve(seconds(10), 'DNF'),
  ]
  assertStat('Ao12 two DNF', averageOfN(ao12TwoDnf, 12), { kind: 'dnf' })

  assertStat('Ao5 blank under 5 solves', averageOfN(ao5A.slice(0, 4), 5), { kind: 'blank' })
  assertDisplay('blank displays as an em dash', { kind: 'blank' }, '—')

  assertStat('mean skips DNF', sessionMean([...ao5A, solve(seconds(50), 'DNF')]), {
    kind: 'numeric',
    ms: seconds(10),
  })
  assertStat('mean blank when every solve is DNF', sessionMean([solve(seconds(8), 'DNF')]), {
    kind: 'blank',
  })

  assertStat('best single ignores DNF', bestSingle([solve(seconds(9)), solve(seconds(8), 'DNF')]), {
    kind: 'numeric',
    ms: seconds(9),
  })
  assertStat('best single blank when all DNF', bestSingle([solve(seconds(8), 'DNF')]), {
    kind: 'blank',
  })

  const rolling = [
    solve(seconds(8)),
    solve(seconds(9)),
    solve(seconds(10)),
    solve(seconds(11)),
    solve(seconds(12)),
    solve(seconds(20)),
  ]
  assertStat('current Ao5 is the last window', averageOfN(rolling, 5), {
    kind: 'numeric',
    ms: seconds(11),
  })
  assertStat('best Ao5 is the fastest window', bestAverageOfN(rolling, 5), {
    kind: 'numeric',
    ms: seconds(10),
  })

  const allDnfWindows = [
    solve(seconds(8)),
    solve(seconds(9)),
    solve(seconds(10), 'DNF'),
    solve(seconds(11), 'DNF'),
    solve(seconds(12), 'DNF'),
  ]
  assertStat('best Ao5 is DNF when every window is DNF', bestAverageOfN(allDnfWindows, 5), {
    kind: 'dnf',
  })

  const stats = computeSessionStats(ao5A)
  assertTrue('count is session length', stats.count === 5)
  assertStat('computeSessionStats current Ao5', stats.averages[5].current, {
    kind: 'numeric',
    ms: seconds(10),
  })
}

verifyAverages()
console.log('stats examples: all passed')
