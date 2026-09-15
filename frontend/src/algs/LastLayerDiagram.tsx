import { useEffect, useState } from 'react'
import { paintLastLayer, type LastLayerPaint, type StickerTone } from './lastLayer'
import type { AlgSetId } from './types'

const FILL: Record<StickerTone, string> = {
  u: 'fill-ll-u',
  d: 'fill-ll-d',
  f: 'fill-ll-f',
  r: 'fill-ll-r',
  b: 'fill-ll-b',
  l: 'fill-ll-l',
  hidden: 'fill-ll-hidden',
}

const EMPTY: LastLayerPaint = {
  u: [
    ['hidden', 'hidden', 'hidden'],
    ['hidden', 'u', 'hidden'],
    ['hidden', 'hidden', 'hidden'],
  ],
  f: ['hidden', 'hidden', 'hidden'],
  r: ['hidden', 'hidden', 'hidden'],
  b: ['hidden', 'hidden', 'hidden'],
  l: ['hidden', 'hidden', 'hidden'],
}

const FACE = 18
const GAP = 2
const SIDE = 8
const ORIGIN = 14
const SPAN = 3 * FACE + 2 * GAP
const SIZE = ORIGIN + SPAN + GAP + SIDE

function faceCell(col: number, row: number) {
  return {
    x: ORIGIN + col * (FACE + GAP),
    y: ORIGIN + row * (FACE + GAP),
  }
}

type LastLayerDiagramProps = {
  alg: string
  set: AlgSetId
}

export default function LastLayerDiagram({ alg, set }: LastLayerDiagramProps) {
  const [paint, setPaint] = useState<LastLayerPaint>(EMPTY)

  useEffect(() => {
    let live = true
    void paintLastLayer(alg, set).then((next) => {
      if (live) setPaint(next)
    })
    return () => {
      live = false
    }
  }, [alg, set])

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-full w-full"
      role="img"
      aria-label={`${set.toUpperCase()} case`}
    >
      {paint.u.map((row, r) =>
        row.map((tone, c) => {
          const { x, y } = faceCell(c, r)
          return (
            <rect
              key={`u-${r}-${c}`}
              x={x}
              y={y}
              width={FACE}
              height={FACE}
              rx={3.5}
              className={FILL[tone]}
            />
          )
        }),
      )}
      {paint.b.map((tone, i) => {
        const { x } = faceCell(i, 0)
        return (
          <rect
            key={`b-${i}`}
            x={x}
            y={ORIGIN - GAP - SIDE}
            width={FACE}
            height={SIDE}
            rx={2.5}
            className={FILL[tone]}
          />
        )
      })}
      {paint.f.map((tone, i) => {
        const { x } = faceCell(i, 0)
        return (
          <rect
            key={`f-${i}`}
            x={x}
            y={ORIGIN + SPAN + GAP}
            width={FACE}
            height={SIDE}
            rx={2.5}
            className={FILL[tone]}
          />
        )
      })}
      {paint.l.map((tone, i) => {
        const { y } = faceCell(0, i)
        return (
          <rect
            key={`l-${i}`}
            x={ORIGIN - GAP - SIDE}
            y={y}
            width={SIDE}
            height={FACE}
            rx={2.5}
            className={FILL[tone]}
          />
        )
      })}
      {paint.r.map((tone, i) => {
        const { y } = faceCell(0, i)
        return (
          <rect
            key={`r-${i}`}
            x={ORIGIN + SPAN + GAP}
            y={y}
            width={SIDE}
            height={FACE}
            rx={2.5}
            className={FILL[tone]}
          />
        )
      })}
    </svg>
  )
}
