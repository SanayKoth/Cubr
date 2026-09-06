import { useEffect, useState } from 'react'
import { getSessions } from '../api/client'
import type { SessionResponse } from '../api/types'

/*
  STEP 1 PLACEHOLDER. This is NOT the real timer — it only proves the stack:
  the wordmark renders in Courier Prime, and we fetch GET /api/sessions and show
  the result (or a visible error). A discriminated union models the three states
  so the type checker forces us to handle each one.
*/
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; sessions: SessionResponse[] }

export default function TimerPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getSessions()
      .then((sessions) => {
        if (!cancelled) setState({ status: 'loaded', sessions })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Unknown error'
        setState({ status: 'error', message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-full bg-bg p-8 font-sans text-text">
      <h1 className="font-brand text-3xl text-text">Cubr</h1>

      <section className="mt-8">
        <h2 className="text-sm uppercase tracking-wide text-text-muted">
          GET /api/sessions
        </h2>

        {state.status === 'loading' && (
          <p className="mt-2 text-text-dim">Loading…</p>
        )}

        {state.status === 'error' && (
          <p className="mt-2 text-text">
            Failed to reach the backend: {state.message}
          </p>
        )}

        {state.status === 'loaded' && (
          <pre className="mt-2 whitespace-pre-wrap text-sm text-text-dim">
            {JSON.stringify(state.sessions, null, 2)}
          </pre>
        )}
      </section>
    </main>
  )
}
