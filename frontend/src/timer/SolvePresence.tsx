const WORD = 'solve'

/*
  Focal stand-in for the running digits. Cleaner display mono, a quiet
  fade/scale wave through each letter.
*/
export default function SolvePresence() {
  return (
    <div
      data-solve-presence
      role="status"
      aria-label="solving"
      className="pointer-events-none flex items-center justify-center"
    >
      <span
        aria-hidden="true"
        className="whitespace-nowrap font-mono text-timer font-normal tracking-[0.04em] text-text"
      >
        {Array.from(WORD).map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="inline-block origin-center opacity-55 solve-wave-letter motion-reduce:animate-none motion-reduce:opacity-90 motion-reduce:scale-100"
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            {letter}
          </span>
        ))}
      </span>
    </div>
  )
}
