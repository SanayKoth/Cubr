import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrambleProvider } from './provider'
import type { Scramble } from './types'
import { wcaProvider } from './wcaProvider'

type NextSlot =
  | { kind: 'pending'; promise: Promise<Scramble> }
  | { kind: 'ready'; scramble: Scramble }

/*
  Two live slots (current + prefetched next) plus one unused previous.
  Skip stashes the shown scramble; back restores it. A second skip replaces
  that stash — only one scramble back, never a history.
*/
export function useScramble(
  event: string,
  provider: ScrambleProvider = wcaProvider,
) {
  const [loaded, setLoaded] = useState<Scramble | null>(null)
  const [previous, setPrevious] = useState<Scramble | null>(null)
  const current = loaded !== null && loaded.event === event ? loaded : null
  const canGoBack = previous !== null && previous.event === event

  const currentRef = useRef<Scramble | null>(null)
  const previousRef = useRef<Scramble | null>(null)
  const nextRef = useRef<NextSlot | null>(null)
  const eventRef = useRef(event)
  const providerRef = useRef(provider)
  const aliveRef = useRef(true)

  useEffect(() => {
    eventRef.current = event
    providerRef.current = provider
  }, [event, provider])

  useEffect(() => {
    currentRef.current = current
  }, [current])

  const prefetch = useCallback(() => {
    const promise = providerRef.current.getNext(eventRef.current)
    const slot: NextSlot = { kind: 'pending', promise }
    nextRef.current = slot
    void promise
      .then((scramble) => {
        if (nextRef.current === slot) {
          nextRef.current = { kind: 'ready', scramble }
        }
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

    if (next?.kind === 'ready') {
      currentRef.current = next.scramble
      setLoaded(next.scramble)
      prefetch()
      return shown
    }

    currentRef.current = null
    setLoaded(null)

    const promise =
      next?.kind === 'pending'
        ? next.promise
        : providerRef.current.getNext(eventRef.current)

    void promise
      .then((scramble) => {
        if (!aliveRef.current) return
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
      .getNext(event)
      .then((scramble) => {
        if (cancelled || !aliveRef.current) return
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
  }, [event, provider, prefetch])

  return { current, consume, skip, back, canGoBack }
}
