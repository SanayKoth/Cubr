import type { Penalty } from '../api/types'
import { effectiveTime } from '../stats/engine'
import { formatSolveTime } from './format'
import type { Solve } from './types'

type SolveListProps = {
  solves: Solve[]
  selectedId: string | null
  personalBestMs: number | null
  onSelect: (id: string) => void
  onSetPenalty: (id: string, penalty: Penalty) => void
  onDelete: (id: string) => void
}

function isPersonalBest(solve: Solve, personalBestMs: number | null): boolean {
  if (personalBestMs === null) return false
  const time = effectiveTime(solve)
  return time.kind === 'numeric' && time.ms === personalBestMs
}

/*
  Newest at the top (CSTimer). Numbers are 1-indexed from the oldest solve so
  deleting renumbers without gaps. Actions stay inline — no dialog.
*/
export default function SolveList({
  solves,
  selectedId,
  personalBestMs,
  onSelect,
  onSetPenalty,
  onDelete,
}: SolveListProps) {
  if (solves.length === 0) return null

  const newestFirst = [...solves].reverse()

  return (
    <ol data-solve-list className="text-lg">
      {newestFirst.map((solve, index) => {
        const number = solves.length - index
        const selected = solve.id === selectedId
        const pb = isPersonalBest(solve, personalBestMs)
        return (
          <li key={solve.id}>
            <button
              type="button"
              tabIndex={-1}
              title={solve.scramble ?? undefined}
              data-solve-id={solve.id}
              data-time-ms={solve.timeMs}
              data-penalty={solve.penalty}
              data-pb={pb ? 'true' : 'false'}
              data-selected={selected ? 'true' : 'false'}
              onClick={() => onSelect(solve.id)}
              className={`flex w-full items-baseline gap-3 py-1 text-left ${
                selected ? 'text-text' : 'text-text-dim'
              }`}
            >
              <span className="w-6 shrink-0 text-right text-text-muted timer-figures">
                {number}
              </span>
              <span className={`timer-figures ${pb ? 'text-accent' : ''}`}>
                {formatSolveTime(solve.timeMs, solve.penalty)}
              </span>
            </button>

            {selected && (
              <div className="mb-2 ml-9 flex gap-4 text-xs text-text-muted">
                <button
                  type="button"
                  tabIndex={-1}
                  data-action="plus-two"
                  onClick={() =>
                    onSetPenalty(
                      solve.id,
                      solve.penalty === 'PLUS_TWO' ? 'NONE' : 'PLUS_TWO',
                    )
                  }
                  className={solve.penalty === 'PLUS_TWO' ? 'text-accent' : ''}
                >
                  +2
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  data-action="dnf"
                  onClick={() =>
                    onSetPenalty(
                      solve.id,
                      solve.penalty === 'DNF' ? 'NONE' : 'DNF',
                    )
                  }
                  className={solve.penalty === 'DNF' ? 'text-accent' : ''}
                >
                  DNF
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  data-action="delete"
                  onClick={() => onDelete(solve.id)}
                >
                  delete
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
