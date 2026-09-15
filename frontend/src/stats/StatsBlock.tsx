import type { TimedSolve } from './types'
import { AO_NS } from './types'
import { computeSessionStats } from './engine'
import { formatStat } from './format'

type StatsBlockProps = {
  solves: readonly TimedSolve[]
  className?: string
}

export default function StatsBlock({ solves, className = '' }: StatsBlockProps) {
  const stats = computeSessionStats(solves)

  return (
    <div
      data-stats-slot
      className={`mt-3 w-fit shrink-0 border-t border-border pt-3 text-sm max-md:mt-2 max-md:pt-2 max-md:text-xs md:fixed md:bottom-6 md:left-6 md:z-20 md:mt-0 md:w-56 ${className}`}
    >
      <div className="grid grid-cols-[3rem_4rem_4rem] items-baseline gap-x-3 gap-y-1">
        <span className="text-text-muted">mean</span>
        <span data-stat="mean" className="text-right font-sans text-text timer-figures">
          {formatStat(stats.mean)}
        </span>
        <span />

        <span className="text-text-muted">best</span>
        <span
          data-stat="single-best"
          className={`text-right font-sans timer-figures ${
            stats.bestSingle.kind === 'numeric' ? 'text-accent' : 'text-text'
          }`}
        >
          {formatStat(stats.bestSingle)}
        </span>
        <span />

        <span className="mt-2 max-md:hidden" />
        <span className="mt-2 text-right text-xs uppercase tracking-wide text-text-muted max-md:hidden">
          current
        </span>
        <span className="mt-2 text-right text-xs uppercase tracking-wide text-text-muted max-md:hidden">
          best
        </span>

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

        <span className="mt-2 text-text-muted">n</span>
        <span
          data-stat="count"
          className="mt-2 text-right font-sans text-text timer-figures"
        >
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
      <span className="text-text-muted max-md:hidden">{label}</span>
      <span data-stat={currentAttr} className="text-right font-sans text-text timer-figures max-md:hidden">
        {current}
      </span>
      <span data-stat={bestAttr} className="text-right font-sans timer-figures text-text-dim max-md:hidden">
        {best}
      </span>
    </>
  )
}
