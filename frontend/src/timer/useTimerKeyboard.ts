import { useEffect, useRef } from 'react'
import type { TimerPhase } from './types'

type TimerKeyboardTarget = {
  phase: TimerPhase
  press: () => void
  release: () => void
  cancel: () => void
}

/*
  Thin adapter: KeyboardEvent in, abstract press / release / cancel out.
  The machine never sees a keyboard event, so a later touch adapter can drive
  the same hook without touching it.
*/
export function useTimerKeyboard({
  phase,
  press,
  release,
  cancel,
}: TimerKeyboardTarget) {
  const phaseRef = useRef(phase)
  const pressRef = useRef(press)
  const releaseRef = useRef(release)
  const cancelRef = useRef(cancel)

  useEffect(() => {
    phaseRef.current = phase
    pressRef.current = press
    releaseRef.current = release
    cancelRef.current = cancel
  }, [phase, press, release, cancel])

  useEffect(() => {
    const held = new Set<string>()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cancelRef.current()
        return
      }

      if (event.repeat) return

      if (event.code === 'Space') {
        event.preventDefault()
        held.add(event.code)
        pressRef.current()
        return
      }

      if (phaseRef.current === 'running') {
        held.add(event.code)
        pressRef.current()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        held.delete(event.code)
        releaseRef.current()
        return
      }

      if (held.has(event.code)) {
        held.delete(event.code)
        releaseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [])
}
