import { useId, useState } from 'react'
import { formatSolveTime } from '../solves/format'
import { bestSingle, effectiveTime, sessionMean } from './engine'
import type { TimedSolve } from './types'

type TimesGraphProps = {
  solves: readonly TimedSolve[]
  className?: string
}

type GraphPoint = {
  ms: number
  label: string
}

type HoverPoint = {
  label: string
  x: number
  y: number
}

const VB_W = 100
const VB_H = 56
const PAD_X = 3
const PAD_Y = 6

export default function TimesGraph({ solves, className = '' }: TimesGraphProps) {
  const washId = `graph-wash-${useId().replaceAll(':', '')}`
  const [hover, setHover] = useState<HoverPoint | null>(null)
  const points: GraphPoint[] = []
  for (const solve of solves) {
    const time = effectiveTime(solve)
    if (time.kind === 'numeric') {
      points.push({
        ms: time.ms,
        label: formatSolveTime(solve.timeMs, solve.penalty),
      })
    }
  }

  if (points.length === 0) return null

  const min = Math.min(...points.map((point) => point.ms))
  const max = Math.max(...points.map((point) => point.ms))
  const span = max - min
  const yMin = span === 0 ? min - 1 : min - span * 0.12
  const yMax = span === 0 ? max + 1 : max + span * 0.12
  const ySpan = yMax - yMin
  const best = bestSingle(solves)
  const mean = sessionMean(solves)
  const innerW = VB_W - PAD_X * 2
  const innerH = VB_H - PAD_Y * 2

  const xAt = (index: number) => {
    if (points.length === 1) return VB_W / 2
    return PAD_X + (index / (points.length - 1)) * innerW
  }
  const yAt = (ms: number) => PAD_Y + (1 - (ms - yMin) / ySpan) * innerH

  const line =
    points.length > 1
      ? points.map((point, index) => `${xAt(index).toFixed(2)},${yAt(point.ms).toFixed(2)}`).join(' ')
      : null
  const area =
    line && points.length > 1
      ? `${line} ${xAt(points.length - 1).toFixed(2)},${VB_H} ${xAt(0).toFixed(2)},${VB_H}`
      : null

  return (
    <div className={`relative w-full ${className}`}>
      <svg
        data-times-graph
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="h-auto w-full text-text-dim"
        aria-hidden="true"
        onPointerLeave={() => setHover(null)}
      >
        {area ? (
          <>
            <defs>
              <linearGradient id={washId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${washId})`} />
          </>
        ) : null}
        {mean.kind === 'numeric' ? (
          <line
            x1={PAD_X}
            x2={VB_W - PAD_X}
            y1={yAt(mean.ms)}
            y2={yAt(mean.ms)}
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="0.6"
          />
        ) : null}
        {line ? (
          <polyline
            fill="none"
            points={line}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {points.map((point, index) => {
          const pb = best.kind === 'numeric' && point.ms === best.ms
          return (
            <circle
              key={`${index}-${point.ms}`}
              cx={xAt(index)}
              cy={yAt(point.ms)}
              r="1.7"
              className={pb ? 'fill-accent' : 'fill-text-dim'}
            />
          )
        })}
        {points.map((point, index) => (
          <circle
            key={`hit-${index}-${point.ms}`}
            cx={xAt(index)}
            cy={yAt(point.ms)}
            r="5"
            className="fill-transparent"
            onPointerOver={() =>
              setHover({
                label: point.label,
                x: (xAt(index) / VB_W) * 100,
                y: (yAt(point.ms) / VB_H) * 100,
              })
            }
          />
        ))}
      </svg>
      {hover ? (
        <div
          data-graph-time
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+0.4rem)] rounded-full glass-dock px-2 py-0.5 font-sans text-xs text-text timer-figures"
          style={{
            left: `${Math.min(88, Math.max(12, hover.x))}%`,
            top: `${hover.y}%`,
          }}
        >
          {hover.label}
        </div>
      ) : null}
    </div>
  )
}
