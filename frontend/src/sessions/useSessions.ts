import { useCallback, useEffect, useRef, useState } from 'react'
import type { Penalty } from '../api/types'
import type { ScrambleType } from '../scramble/types'
import type { NewSolve, Solve } from '../solves/types'
import { readActiveSessionId } from '../storage/activeSession'
import {
  backfillOutboxIfNeeded,
  enqueueDeleteSolve,
  enqueueSession,
  enqueueSolve,
  hasPostableScramble,
  solvePayloadFromRow,
} from '../storage/outbox'
import {
  ensureClientId,
  getStoredSolve,
  isPersistenceEnabled,
  loadLiveSessions,
  persistActiveId,
  persistSession,
  persistSolve,
  persistSolveDeleted,
  persistSolvePenalty,
  pickActiveId,
} from '../storage/repository'
import { createDefaultSession, createSession } from './create'
import { bufferPreReadySolve, buildSolve, takePreReadySolves } from './pendingSolves'
import type { Session } from './types'

function sessionPayload(session: Session) {
  return { id: session.id, name: session.name, event: session.event }
}

async function persistAndEnqueueSolve(sessionId: string, solve: Solve) {
  await persistSolve(sessionId, solve)
  if (hasPostableScramble(solve.scramble)) {
    await enqueueSolve({
      sessionId,
      id: solve.id,
      timeMs: solve.timeMs,
      scramble: solve.scramble,
      timestamp: solve.timestamp,
      penalty: solve.penalty,
    })
  }
}

function attachSolves(session: Session, extra: Solve[]): Session {
  if (extra.length === 0) return session
  return { ...session, solves: [...session.solves, ...extra] }
}

function markFlushed(count: number, setCount: (value: number) => void) {
  setCount(count)
  if (count > 0) {
    console.info(`[cubr] flushed ${count} pre-ready solve(s)`)
  }
}

export function useSessions() {
  const [ready, setReady] = useState(false)
  const [preReadyFlushed, setPreReadyFlushed] = useState(0)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const readyRef = useRef(false)
  const activeIdRef = useRef<string | null>(null)

  const active = sessions.find((session) => session.id === activeId) ?? sessions[0] ?? null

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      await ensureClientId()
      const loaded = await loadLiveSessions()
      if (cancelled) return

      if (loaded === null || !isPersistenceEnabled()) {
        const fallback = createDefaultSession()
        readyRef.current = true
        activeIdRef.current = fallback.id
        const extra = takePreReadySolves().map(buildSolve)
        setSessions([attachSolves(fallback, extra)])
        setActiveId(fallback.id)
        markFlushed(extra.length, setPreReadyFlushed)
        setReady(true)
        return
      }

      await backfillOutboxIfNeeded()
      if (cancelled) return

      if (loaded.length === 0) {
        const created = createDefaultSession()
        readyRef.current = true
        activeIdRef.current = created.id
        const extra = takePreReadySolves().map(buildSolve)
        const session = attachSolves(created, extra)
        setSessions([session])
        setActiveId(session.id)
        markFlushed(extra.length, setPreReadyFlushed)
        persistActiveId(session.id)
        await persistSession(created)
        await enqueueSession(sessionPayload(created))
        for (const solve of extra) {
          await persistAndEnqueueSolve(session.id, solve)
        }
        setReady(true)
        return
      }

      const nextActiveId = pickActiveId(loaded, readActiveSessionId())
      readyRef.current = true
      activeIdRef.current = nextActiveId
      const extra = takePreReadySolves().map(buildSolve)
      setSessions(
        loaded.map((session) =>
          session.id === nextActiveId ? attachSolves(session, extra) : session,
        ),
      )
      setActiveId(nextActiveId)
      markFlushed(extra.length, setPreReadyFlushed)
      persistActiveId(nextActiveId)
      for (const solve of extra) {
        await persistAndEnqueueSolve(nextActiveId, solve)
      }
      setReady(true)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const switchTo = useCallback((id: string) => {
    activeIdRef.current = id
    setActiveId(id)
    persistActiveId(id)
  }, [])

  const addSession = useCallback(
    (name: string, event: string, scrambleType: ScrambleType = 'WCA') => {
      const session = createSession(name, event, scrambleType)
      setSessions((current) => [...current, session])
      activeIdRef.current = session.id
      setActiveId(session.id)
      persistActiveId(session.id)
      void persistSession(session)
      void enqueueSession(sessionPayload(session))
      return session
    },
    [],
  )

  const setEvent = useCallback((event: string) => {
    const now = new Date().toISOString()
    setSessions((current) =>
      current.map((session) =>
        session.id === activeId ? { ...session, event, updatedAt: now } : session,
      ),
    )
    if (active) {
      const next = { ...active, event, updatedAt: now }
      void persistSession(next)
      void enqueueSession(sessionPayload(next))
    }
  }, [active, activeId])

  const setScrambleType = useCallback((scrambleType: ScrambleType) => {
    const now = new Date().toISOString()
    setSessions((current) =>
      current.map((session) =>
        session.id === activeId ? { ...session, scrambleType, updatedAt: now } : session,
      ),
    )
    if (active) void persistSession({ ...active, scrambleType, updatedAt: now })
  }, [active, activeId])

  const appendSolve = useCallback((entry: NewSolve) => {
    const sessionId = activeIdRef.current
    if (!readyRef.current || !sessionId) {
      bufferPreReadySolve(entry)
      return
    }
    const solve = buildSolve(entry)
    setSessions((current) =>
      current.map((session) =>
        session.id === sessionId
          ? { ...session, solves: [...session.solves, solve] }
          : session,
      ),
    )
    void persistAndEnqueueSolve(sessionId, solve)
  }, [])

  const setPenalty = useCallback(
    (id: string, penalty: Penalty) => {
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? {
                ...session,
                solves: session.solves.map((solve) =>
                  solve.id === id ? { ...solve, penalty } : solve,
                ),
              }
            : session,
        ),
      )
      void (async () => {
        await persistSolvePenalty(id, penalty)
        const row = await getStoredSolve(id)
        const payload = row ? solvePayloadFromRow(row) : null
        if (payload) await enqueueSolve(payload)
      })()
    },
    [activeId],
  )

  const deleteSolve = useCallback(
    (id: string) => {
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? {
                ...session,
                solves: session.solves.filter((solve) => solve.id !== id),
              }
            : session,
        ),
      )
      void persistSolveDeleted(id)
      void enqueueDeleteSolve(id)
    },
    [activeId],
  )

  return {
    ready,
    preReadyFlushed,
    sessions,
    active,
    switchTo,
    addSession,
    setEvent,
    setScrambleType,
    appendSolve,
    setPenalty,
    deleteSolve,
  }
}
