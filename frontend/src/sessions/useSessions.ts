import { useCallback, useRef, useState } from 'react'
import type { Penalty } from '../api/types'
import type { Solve } from '../solves/types'
import { eventLabel } from './events'
import type { Session } from './types'

function createSession(name: string, event: string): Session {
  const trimmed = name.trim()
  return {
    id: crypto.randomUUID(),
    name: trimmed.length > 0 ? trimmed : eventLabel(event),
    event,
    createdAt: new Date().toISOString(),
    solves: [],
  }
}

function createDefaultSession(): Session {
  return createSession('3x3', '333')
}

export function useSessions() {
  const nextListId = useRef(1)
  const [sessions, setSessions] = useState<Session[]>(() => [createDefaultSession()])
  const [activeId, setActiveId] = useState(sessions[0].id)

  const active = sessions.find((session) => session.id === activeId) ?? sessions[0]

  const switchTo = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const addSession = useCallback((name: string, event: string) => {
    const session = createSession(name, event)
    setSessions((current) => [...current, session])
    setActiveId(session.id)
    return session
  }, [])

  const setEvent = useCallback((event: string) => {
    setSessions((current) =>
      current.map((session) =>
        session.id === activeId ? { ...session, event } : session,
      ),
    )
  }, [activeId])

  const appendSolve = useCallback(
    (entry: Omit<Solve, 'listId'>) => {
      const listId = nextListId.current
      nextListId.current += 1
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? { ...session, solves: [...session.solves, { ...entry, listId }] }
            : session,
        ),
      )
    },
    [activeId],
  )

  const setPenalty = useCallback(
    (listId: number, penalty: Penalty) => {
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? {
                ...session,
                solves: session.solves.map((solve) =>
                  solve.listId === listId ? { ...solve, penalty } : solve,
                ),
              }
            : session,
        ),
      )
    },
    [activeId],
  )

  const deleteSolve = useCallback(
    (listId: number) => {
      setSessions((current) =>
        current.map((session) =>
          session.id === activeId
            ? {
                ...session,
                solves: session.solves.filter((solve) => solve.listId !== listId),
              }
            : session,
        ),
      )
    },
    [activeId],
  )

  return {
    sessions,
    active,
    switchTo,
    addSession,
    setEvent,
    appendSolve,
    setPenalty,
    deleteSolve,
  }
}
