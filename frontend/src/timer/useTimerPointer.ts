import { useEffect, useRef } from 'react'

const CONTROL_SELECTOR = [
  '[data-solve-list]',
  '[data-session-ui]',
  '[data-session-create]',
  '[data-scramble]',
  '[data-scramble-nav]',
  '[data-scramble-meta]',
  '[data-scramble-picker]',
  '[data-scramble-preview]',
  '[data-preview-overlay]',
  '[data-brand]',
  '[data-edge-swipe]',
  '[data-settings]',
  '[data-algs]',
  '[data-app-dock]',
  '[data-inspection]',
  '[data-cancel-inspection]',
  '[data-times-sheet]',
  '[data-times-backdrop]',
  '[data-session-affordance]',
  '[data-times-affordance]',
  '[data-solve-card]',
  '[data-solve-card-overlay]',
  '[data-stats-panel]',
  '[data-stats-toggle]',
].join(',')

type TimerPointerTarget = {
  press: () => void
  release: () => void
  enabled: boolean
}

function isControl(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return true
  if (!(target instanceof Element)) return false
  return Boolean(target.closest(CONTROL_SELECTOR))
}

/*
  Thin adapter: PointerEvent in, abstract press / release out.
  Sibling to useTimerKeyboard — the machine never sees a pointer event.
*/
export function useTimerPointer({ press, release, enabled }: TimerPointerTarget) {
  const pressRef = useRef(press)
  const releaseRef = useRef(release)

  useEffect(() => {
    pressRef.current = press
    releaseRef.current = release
  }, [press, release])

  useEffect(() => {
    if (!enabled) return

    let held = false

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return
      // Mouse on md+ would turn click-to-dismiss into a hold. Touch/pen still time.
      if (
        event.pointerType === 'mouse' &&
        window.matchMedia('(min-width: 768px)').matches
      ) {
        return
      }
      if (isControl(event.target)) return
      event.preventDefault()
      held = true
      pressRef.current()
    }

    const endHold = (event: PointerEvent) => {
      if (!event.isPrimary) return
      if (!held) return
      event.preventDefault()
      held = false
      releaseRef.current()
    }

    document.addEventListener('pointerdown', onPointerDown, { passive: false })
    document.addEventListener('pointerup', endHold, { passive: false })
    document.addEventListener('pointercancel', endHold)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('pointerup', endHold)
      document.removeEventListener('pointercancel', endHold)
    }
  }, [enabled])
}
