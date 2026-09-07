import type { TimedSolve } from './types'
import { AO_NS } from './types'
import { computeSessionStats } from './engine'
import { formatStat } from './format'

type StatsBlockProps = {
  solves: readonly TimedSolve[]
}

export default function StatsBlock({ solves }: StatsBlockProps) {
  const stats = computeSessionStats(solves)

  return (
    <div data-stats-slot className="mt-3 shrink-0 text-sm text-text-dim">
      <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-x-3">
        <span>1</span>
        <span data-stat="single-current" className="text-right font-sans text-text timer-figures">
          {formatStat(stats.currentSingle)}
        </span>
        <span data-stat="single-best" className="text-right timer-figures text-text-muted">
          {formatStat(stats.bestSingle)}
        </span>

        {AO_NS.map((n) => (
          <AoRow
            key={n}
            label={String(n)}
            current={formatStat(stats.averages[n].current)}
            best={formatStat(stats.averages[n].best)}
            currentAttr={`ao${n}-current`}
            bestAttr={`ao${n}-best`}
          />
        ))}

        <span>mean</span>
        <span data-stat="mean" className="text-right font-sans text-text timer-figures">
          {formatStat(stats.mean)}
        </span>
        <span />

        <span>n</span>
        <span data-stat="count" className="text-right font-sans text-text timer-figures">
          {stats.count}
        </span>
        <span />
      </div>
    </div>
  )
}

function AoRow({
  label,
  current,
  best,
  currentAttr,
  bestAttr,
}: {
  label: string
  current: string
  best: string
  currentAttr: string
  bestAttr: string
}) {
  return (
    <>
      <span>{label}</span>
      <span data-stat={currentAttr} className="text-right font-sans text-text timer-figures">
        {current}
      </span>
      <span data-stat={bestAttr} className="text-right timer-figures text-text-muted">
        {best}
      </span>
    </>
  )
}
