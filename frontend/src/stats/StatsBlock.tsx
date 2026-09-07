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
    <div data-stats-slot className="mt-3 shrink-0 border-t border-border pt-3 text-sm">
      <div className="grid grid-cols-[3.25rem_1fr_1fr] items-baseline gap-x-3 gap-y-1">
        <span className="text-text-muted">mean</span>
        <span data-stat="mean" className="text-right font-sans text-text timer-figures">
          {formatStat(stats.mean)}
        </span>
        <span />

        <span className="text-text-muted">best</span>
        <span data-stat="single-best" className="text-right font-sans text-text timer-figures">
          {formatStat(stats.bestSingle)}
        </span>
        <span />

        <span />
        <span className="pt-1 text-right text-xs text-text-muted">current</span>
        <span className="pt-1 text-right text-xs text-text-muted">best</span>

        {AO_NS.map((n) => (
          <AoRow
            key={n}
            label={`ao${n}`}
            current={formatStat(stats.averages[n].current)}
            best={formatStat(stats.averages[n].best)}
            currentAttr={`ao${n}-current`}
            bestAttr={`ao${n}-best`}
          />
        ))}

        <span className="pt-1 text-text-muted">n</span>
        <span data-stat="count" className="pt-1 text-right font-sans text-text timer-figures">
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
      <span className="text-text-muted">{label}</span>
      <span data-stat={currentAttr} className="text-right font-sans text-text timer-figures">
        {current}
      </span>
      <span data-stat={bestAttr} className="text-right timer-figures text-text-dim">
        {best}
      </span>
    </>
  )
}
