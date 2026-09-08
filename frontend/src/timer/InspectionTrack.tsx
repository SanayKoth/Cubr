import { INSPECTION_LIMIT_MS } from './types'

const DRAIN = `${INSPECTION_LIMIT_MS}ms`

export default function InspectionTrack() {
  return (
    <div
      data-inspection-track
      className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-[min(22rem,75vmin)] -translate-x-1/2 -translate-y-1/2"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <defs>
          <filter
            id="inspect-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          className="stroke-border"
          strokeWidth="1.25"
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          pathLength="1"
          strokeDasharray="1 1"
          className="stroke-accent inspect-drain"
          strokeWidth="1.75"
          filter="url(#inspect-glow)"
          style={{ animationDuration: DRAIN }}
        />
      </svg>
    </div>
  )
}
