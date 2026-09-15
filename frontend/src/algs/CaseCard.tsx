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
    <article data-alg-case={entry.id} className="glass-panel rounded-3xl p-5">
      <div className="size-28">
        <LastLayerDiagram alg={shown} set={set} />
      </div>
      <h2 className="mt-4 text-base tracking-tight text-text">{entry.name}</h2>
      <ul className="mt-3 flex flex-col">
        {entry.algs.map((alg, index) => {
          const active = selected === index
          return (
            <li key={alg}>
              <button
                type="button"
                data-alg-alt={index === 0 ? undefined : index}
                onClick={() => setSelected(index)}
                className={`w-full py-1.5 text-left font-brand text-sm leading-snug ${
                  active ? 'text-accent' : 'text-text-muted hover:text-text-dim'
                }`}
              >
                {displayAlg(alg)}
              </button>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
