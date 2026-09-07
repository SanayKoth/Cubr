import { useCallback, useEffect, useState } from 'react'
import type { Penalty } from '../api/types'
import type { ScrambleType } from '../scramble/types'
import type { NewSolve } from '../solves/types'
import { readActiveSessionId } from '../storage/activeSession'
import {
  ensureClientId,
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
import type { Session } from './types'

export function useSessions() {
  const [ready, setReady] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const active = sessions.find((session) => session.id === activeId) ?? sessions[0] ?? null

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      await ensureClientId()
      const loaded = await loadLiveSessions()
      if (cancelled) return

      if (loaded === null || !isPersistenceEnabled()) {
        const fallback = createDefaultSession()
        setSessions([fallback])
        setActiveId(fallback.id)
        setReady(true)
        return
      }

      if (loaded.length === 0) {
        const created = createDefaultSession()
        setSessions([created])
        setActiveId(created.id)
        persistActiveId(created.id)
        await persistSession(created)
        setReady(true)
        return
      }

      const nextActiveId = pickActiveId(loaded, readActiveSessionId())
      setSessions(loaded)
      setActiveId(nextActiveId)
      persistActiveId(nextActiveId)
      setReady(true)
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [])

  const switchTo = useCallback((id: string) => {
    setActiveId(id)
    persistActiveId(id)
  }, [])

  const addSession = useCallback(
    (name: string, event: string, scrambleType: ScrambleType = 'WCA') => {
      const session = createSession(name, event, scrambleType)
      setSessions((current) => [...current, session])
      setActiveId(session.id)
      persistActiveId(session.id)
      void persistSession(session)
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
    if (active) void persistSession({ ...active, event, updatedAt: now })
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

  const appendSolve = useCallback(
    (entry: NewSolve) => {
      if (!activeId) return
      const timestamp = new Date().toISOString()
      const solve = {
        id: crypto.randomUUID(),
        timeMs: entry.timeMs,
        penalty: entry.penalty,
        scramble: entry.scramble,
        timestamp,
      }
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? { ...session, solves: [...session.solves, solve] }
            : session,
        ),
      )
      void persistSolve(activeId, solve)
    },
    [activeId],
  )

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
      void persistSolvePenalty(id, penalty)
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
    },
    [activeId],
  )

  return {
    ready,
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
