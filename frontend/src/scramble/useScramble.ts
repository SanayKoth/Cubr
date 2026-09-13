import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrambleProvider } from './provider'
import type { Scramble, ScrambleType } from './types'
import { wcaProvider } from './wcaProvider'

type NextSlot =
  | { kind: 'pending'; promise: Promise<Scramble> }
  | { kind: 'ready'; scramble: Scramble }

function matchesRequest(scramble: Scramble, event: string, scrambleType: ScrambleType): boolean {
  return scramble.event === event && scramble.scrambleType === scrambleType
}

function isLiveRequest(
  scramble: Scramble,
  eventRef: { current: string },
  scrambleTypeRef: { current: ScrambleType },
): boolean {
  return matchesRequest(scramble, eventRef.current, scrambleTypeRef.current)
}

/*
  Two live slots (current + prefetched next) plus one unused previous.
  Skip stashes the shown scramble; back restores it. A second skip replaces
  that stash — only one scramble back, never a history.
  loaded is stale unless both event and scrambleType match the request.
*/
export function useScramble(
  event: string,
  scrambleType: ScrambleType,
  provider: ScrambleProvider = wcaProvider,
) {
  const [loaded, setLoaded] = useState<Scramble | null>(null)
  const [previous, setPrevious] = useState<Scramble | null>(null)
  const current =
    loaded !== null && matchesRequest(loaded, event, scrambleType) ? loaded : null
  const canGoBack =
    previous !== null && matchesRequest(previous, event, scrambleType)

  const currentRef = useRef<Scramble | null>(null)
  const previousRef = useRef<Scramble | null>(null)
  const nextRef = useRef<NextSlot | null>(null)
  const eventRef = useRef(event)
  const scrambleTypeRef = useRef(scrambleType)
  const providerRef = useRef(provider)
  const aliveRef = useRef(true)

  useEffect(() => {
    eventRef.current = event
    scrambleTypeRef.current = scrambleType
    providerRef.current = provider
  }, [event, scrambleType, provider])

  useEffect(() => {
    currentRef.current = current
  }, [current])

  const prefetch = useCallback(() => {
    const promise = providerRef.current.getNext(
      eventRef.current,
      scrambleTypeRef.current,
    )
    const slot: NextSlot = { kind: 'pending', promise }
    nextRef.current = slot
    void promise
      .then((scramble) => {
        if (nextRef.current !== slot) return
        if (!isLiveRequest(scramble, eventRef, scrambleTypeRef)) {
          nextRef.current = null
          return
        }
        nextRef.current = { kind: 'ready', scramble }
      })
      .catch(() => {
        if (nextRef.current === slot) {
          nextRef.current = null
        }
      })
  }, [])

  const promote = useCallback((): Scramble | null => {
    const shown = currentRef.current
    const next = nextRef.current
    nextRef.current = null

    if (next?.kind === 'ready' && isLiveRequest(next.scramble, eventRef, scrambleTypeRef)) {
      currentRef.current = next.scramble
      setLoaded(next.scramble)
      prefetch()
      return shown
    }

    currentRef.current = null
    setLoaded(null)

    const promise =
      next?.kind === 'pending'
        ? next.promise.then((scramble) =>
            isLiveRequest(scramble, eventRef, scrambleTypeRef)
              ? scramble
              : providerRef.current.getNext(eventRef.current, scrambleTypeRef.current),
          )
        : providerRef.current.getNext(eventRef.current, scrambleTypeRef.current)

    void promise
      .then((scramble) => {
        if (!aliveRef.current) return
        if (!isLiveRequest(scramble, eventRef, scrambleTypeRef)) return
        currentRef.current = scramble
        setLoaded(scramble)
        prefetch()
      })
      .catch(() => {
        if (!aliveRef.current) return
        currentRef.current = null
        setLoaded(null)
      })

    return shown
  }, [prefetch])

  const consume = useCallback((): Scramble | null => {
    previousRef.current = null
    setPrevious(null)
    return promote()
  }, [promote])

  const skip = useCallback(() => {
    const shown = currentRef.current
    if (!shown) return
    previousRef.current = shown
    setPrevious(shown)
    promote()
  }, [promote])

  const back = useCallback(() => {
    const stored = previousRef.current
    const shown = currentRef.current
    if (!stored || !shown) return
    previousRef.current = null
    setPrevious(null)
    nextRef.current = { kind: 'ready', scramble: shown }
    currentRef.current = stored
    setLoaded(stored)
  }, [])

  useEffect(() => {
    aliveRef.current = true
    let cancelled = false
    currentRef.current = null
    previousRef.current = null
    nextRef.current = null

    void provider
      .getNext(event, scrambleType)
      .then((scramble) => {
        if (cancelled || !aliveRef.current) return
        if (!isLiveRequest(scramble, eventRef, scrambleTypeRef)) return
        previousRef.current = null
        setPrevious(null)
        currentRef.current = scramble
        setLoaded(scramble)
        prefetch()
      })
      .catch((error) => {
        console.error('scramble generation failed', error)
      })

    return () => {
      cancelled = true
      aliveRef.current = false
    }
  }, [event, scrambleType, provider, prefetch])

  return { current, consume, skip, back, canGoBack }
}
