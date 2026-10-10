import { bestSingle, sampleSigma, timeRange, worstSingle } from './engine'
import { formatStat } from './format'
import TimesGraph from './TimesGraph'
import type { TimedSolve } from './types'

type SessionGraphProps = {
  solves: readonly TimedSolve[]
}

function numericCount(solves: readonly TimedSolve[]): number {
  let count = 0
  for (const solve of solves) {
    if (solve.penalty !== 'DNF') count += 1
  }
  return count
}

export default function SessionGraph({ solves }: SessionGraphProps) {
  const empty = numericCount(solves) === 0
  const best = bestSingle(solves)
  const worst = worstSingle(solves)
  const range = timeRange(solves)
  const sigma = sampleSigma(solves)

  return (
    <div data-session-graph className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {empty ? (
        <p className="flex flex-1 items-center text-sm text-text-muted max-md:text-xs">
          no times yet
        </p>
      ) : (
        <div className="relative w-full shrink-0">
          <TimesGraph solves={solves} />
        </div>
      )}
      <dl className="mt-3 grid min-h-0 flex-1 grid-cols-2 content-start gap-x-3 gap-y-3 max-md:mt-4 max-md:gap-y-5 md:mt-2 md:flex-none md:gap-y-1">
        <Row
          label="best"
          value={formatStat(best)}
          attr="graph-best"
          accent={best.kind === 'numeric'}
        />
        <Row label="worst" value={formatStat(worst)} attr="worst" />
        <Row label="range" value={formatStat(range)} attr="range" />
        <Row label="σ" value={formatStat(sigma)} attr="sigma" />
      </dl>
    </div>
  )
}

function Row({
  label,
  value,
  attr,
  accent = false,
}: {
  label: string
  value: string
  attr: string
  accent?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 max-md:flex-col max-md:items-start max-md:gap-0.5">
      <dt className="text-xs text-text-muted md:text-sm">{label}</dt>
      <dd
        data-stat={attr}
        className={`font-sans timer-figures max-md:text-lg md:text-sm ${
          accent ? 'text-accent' : 'text-text'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
