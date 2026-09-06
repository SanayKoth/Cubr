import { useCallback, useEffect, useRef, useState } from 'react'
import type { ScrambleProvider } from './provider'
import type { Scramble } from './types'
import { wcaProvider } from './wcaProvider'

type NextSlot =
  | { kind: 'pending'; promise: Promise<Scramble> }
  | { kind: 'ready'; scramble: Scramble }

/*
  Two slots: current (shown) and next (prefetched). After the first scramble
  resolves we immediately start the next one, so a consume/promote is a
  synchronous swap when prefetch has finished — which it should have, because
  it ran during the previous solve.
*/
export function useScramble(
  event: string,
  provider: ScrambleProvider = wcaProvider,
) {
  const [current, setCurrent] = useState<Scramble | null>(null)

  const currentRef = useRef<Scramble | null>(null)
  const nextRef = useRef<NextSlot | null>(null)
  const eventRef = useRef(event)
  const providerRef = useRef(provider)
  const aliveRef = useRef(true)

  useEffect(() => {
    eventRef.current = event
    providerRef.current = provider
  }, [event, provider])

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

  const consume = useCallback((): Scramble | null => {
    const shown = currentRef.current
    const next = nextRef.current
    nextRef.current = null

    if (next?.kind === 'ready') {
      currentRef.current = next.scramble
      setCurrent(next.scramble)
      prefetch()
      return shown
    }

    currentRef.current = null
    setCurrent(null)

    const promise =
      next?.kind === 'pending'
        ? next.promise
        : providerRef.current.getNext(eventRef.current)

    void promise
      .then((scramble) => {
        if (!aliveRef.current) return
        currentRef.current = scramble
        setCurrent(scramble)
        prefetch()
      })
      .catch(() => {
        if (!aliveRef.current) return
        currentRef.current = null
        setCurrent(null)
      })

    return shown
  }, [prefetch])

  useEffect(() => {
    aliveRef.current = true
    let cancelled = false
    currentRef.current = null
    nextRef.current = null

    void provider.getNext(event).then((scramble) => {
      if (cancelled || !aliveRef.current) return
      currentRef.current = scramble
      setCurrent(scramble)
      prefetch()
    })

    return () => {
      cancelled = true
      aliveRef.current = false
    }
  }, [event, provider, prefetch])

  return { current, consume }
}
