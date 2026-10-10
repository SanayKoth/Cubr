import { useState } from 'react'
import { displayAlg } from './format'
import LastLayerDiagram from './LastLayerDiagram'
import type { AlgCase, AlgSetId } from './types'

type CaseCardProps = {
  entry: AlgCase
  set: AlgSetId
}

export default function CaseCard({ entry, set }: CaseCardProps) {
  const [selected, setSelected] = useState(0)
  const shown = entry.algs[selected] ?? entry.algs[0] ?? ''

  return (
    <article
      data-alg-case={entry.id}
      className="glass-dock flex min-h-24 items-center gap-4 rounded-[1.75rem] px-4 py-3.5"
    >
      <div className="size-[4.75rem] shrink-0">
        <LastLayerDiagram alg={shown} set={set} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-xs text-text-dim">
            {set === 'oll' ? (
              <>
                <span>{entry.id}</span>
                <span className="px-1.5">·</span>
                {entry.name}
              </>
            ) : (
              entry.name
            )}
          </h2>
          {entry.algs.length > 1 && (
            <div className="flex shrink-0 gap-1">
              {entry.algs.map((_, index) => {
                const active = selected === index
                return (
                  <button
                    key={index}
                    type="button"
                    data-alg-alt={index === 0 ? undefined : index}
                    aria-label={`algorithm ${index + 1}`}
                    onClick={() => setSelected(index)}
                    className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                      active
                        ? 'bg-text/16 text-accent'
                        : 'bg-text/6 text-text-muted hover:text-text-dim'
                    }`}
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 font-brand text-base leading-snug text-accent">
          {displayAlg(shown)}
        </p>
      </div>
    </article>
  )
}
