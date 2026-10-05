import { lazy, Suspense, type Ref } from 'react'
import { stickeringFor } from '../scramble/catalog'
import type { ScrambleType } from '../scramble/types'
import type { SolveCardModel } from './cardModel'

const ScramblePreview = lazy(() => import('../preview/ScramblePreview'))

type SolveCardFaceProps = {
  model: SolveCardModel
  event: string
  scrambleType: ScrambleType
  previewHostRef: Ref<HTMLDivElement>
}

export default function SolveCardFace({
  model,
  event,
  scrambleType,
  previewHostRef,
}: SolveCardFaceProps) {
  return (
    <article
      data-solve-card
      role="dialog"
      aria-modal="true"
      aria-label="solve"
      className="solve-card relative w-full max-w-[20rem] max-h-[min(80dvh,34rem)] overflow-y-auto rounded-[1.75rem] px-5 pt-5 pb-4"
    >
      <header className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="font-brand text-sm text-accent">Cubr</span>
          <span className="text-xs text-text-muted">{model.kind}</span>
        </span>
        <span className="text-xs text-text-muted timer-figures">#{model.number}</span>
      </header>

      {model.scramble ? (
        <div ref={previewHostRef} className="relative z-10 mx-auto mt-1 size-48">
          <Suspense fallback={null}>
            <ScramblePreview
              event={event}
              moves={model.scramble}
              stickering={stickeringFor(scrambleType)}
            />
          </Suspense>
        </div>
      ) : null}

      <p
        className={`mt-1 text-center font-sans text-5xl tracking-tight timer-figures ${
          model.pbThen ? 'text-accent' : 'text-text'
        }`}
      >
        {model.timeLabel}
      </p>
      <p className="mt-1 truncate text-center text-sm text-text-muted">
        {model.sessionName}
      </p>

      <div className="mx-10 mt-4 h-px bg-accent/20" />

      <div className="mt-3.5 flex justify-center gap-10">
        <Average label="ao5" value={model.ao5} />
        <Average label="ao12" value={model.ao12} />
      </div>

      {model.scramble ? (
        <p className="mt-4 text-center text-[13px] leading-snug text-text-dim">
          {model.scramble}
        </p>
      ) : null}

      {model.when ? (
        <p className="mt-3.5 text-center text-xs text-text-muted">{model.when}</p>
      ) : null}
    </article>
  )
}

function Average({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[11px] tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-base text-text timer-figures">{value}</p>
    </div>
  )
}
