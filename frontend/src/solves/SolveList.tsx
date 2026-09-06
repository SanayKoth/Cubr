import type { Penalty } from '../api/types'
import { formatSolveTime } from './format'
import type { Solve } from './types'

type SolveListProps = {
  solves: Solve[]
  selectedId: number | null
  onSelect: (listId: number) => void
  onSetPenalty: (listId: number, penalty: Penalty) => void
  onDelete: (listId: number) => void
}

/*
  Newest at the top (CSTimer). Numbers are 1-indexed from the oldest solve so
  deleting renumbers without gaps. Actions stay inline — no dialog.
*/
export default function SolveList({
  solves,
  selectedId,
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
        const selected = solve.listId === selectedId
        return (
          <li key={solve.listId}>
            <button
              type="button"
              tabIndex={-1}
              title={solve.scrambleMoves ?? undefined}
              data-solve-id={solve.listId}
              data-time-ms={solve.timeMs}
              data-penalty={solve.penalty}
              data-selected={selected ? 'true' : 'false'}
              onClick={() => onSelect(solve.listId)}
              className={`flex w-full items-baseline gap-3 py-1 text-left ${
                selected ? 'text-text' : 'text-text-dim'
              }`}
            >
              <span className="w-6 shrink-0 text-right text-text-muted timer-figures">
                {number}
              </span>
              <span className="timer-figures">
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
                      solve.listId,
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
                      solve.listId,
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
                  onClick={() => onDelete(solve.listId)}
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
