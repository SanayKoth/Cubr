import { useEffect, useRef, type RefObject } from 'react'

const AXIS_LOCK_PX = 6
const COMMIT_PX = 90
const FOLLOW = 0.55
const MAX_FOLLOW_PX = 140
const GESTURE_GAP_MS = 140
const SPRING = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease-out'

function isDesktop(): boolean {
  return window.matchMedia('(min-width: 768px)').matches
}

function scrollsHorizontally(target: EventTarget | null, dx: number): boolean {
  let el = target instanceof Element ? target : null
  while (el && el !== document.body) {
    const { overflowX } = getComputedStyle(el)
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
      const canMove =
        dx < 0 ? el.scrollLeft > 0 : el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      if (canMove) return true
    }
    el = el.parentElement
  }
  return false
}

type TrackpadSwipe = {
  enabled: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

/*
  Two-finger horizontal trackpad swipe on desktop. The page follows the
  fingers, then hands off to the slide transition once it passes the commit
  distance; short swipes spring back. Fingers moving left (deltaX > 0)
  mirrors the phone edge swipe toward the left edge.

  A reversal starts a fresh gesture, so a swipe back is not swallowed by
  the momentum tail of the swipe that brought you here.
*/
export function useTrackpadSwipe(
  target: RefObject<HTMLElement | null>,
  { enabled, onSwipeLeft, onSwipeRight }: TrackpadSwipe,
) {
  const leftRef = useRef(onSwipeLeft)
  const rightRef = useRef(onSwipeRight)

  useEffect(() => {
    leftRef.current = onSwipeLeft
    rightRef.current = onSwipeRight
  }, [onSwipeLeft, onSwipeRight])

  useEffect(() => {
    if (!enabled) return

    let axis: 'x' | 'y' | null = null
    let sumX = 0
    let sumY = 0
    let total = 0
    let sign = 0
    let committed = false
    let gapTimer = 0

    const paint = (dx: number) => {
      const el = target.current
      if (!el) return
      const follow = Math.max(-MAX_FOLLOW_PX, Math.min(MAX_FOLLOW_PX, -dx * FOLLOW))
      el.style.transition = 'none'
      el.style.transform = follow ? `translate3d(${follow}px, 0, 0)` : ''
      el.style.opacity = follow ? String(1 - (Math.abs(follow) / MAX_FOLLOW_PX) * 0.35) : ''
    }

    const springBack = () => {
      const el = target.current
      if (!el || !el.style.transform) return
      el.style.transition = SPRING
      el.style.transform = ''
      el.style.opacity = ''
    }

    const reset = () => {
      axis = null
      sumX = 0
      sumY = 0
      total = 0
      sign = 0
      committed = false
    }

    const startHorizontal = (dx: number) => {
      axis = 'x'
      sign = Math.sign(dx)
      total = dx
      committed = false
    }

    const allowed = (dir: number) =>
      dir > 0 ? Boolean(leftRef.current) : dir < 0 ? Boolean(rightRef.current) : false

    const onWheel = (event: WheelEvent) => {
      if (!isDesktop() || event.ctrlKey) return

      window.clearTimeout(gapTimer)
      gapTimer = window.setTimeout(() => {
        if (!committed) springBack()
        reset()
      }, GESTURE_GAP_MS)

      const { deltaX, deltaY } = event
      if (axis === null) {
        sumX += deltaX
        sumY += deltaY
        if (Math.abs(sumX) + Math.abs(sumY) < AXIS_LOCK_PX) return
        if (Math.abs(sumX) > Math.abs(sumY) * 1.2 && !scrollsHorizontally(event.target, sumX)) {
          startHorizontal(sumX)
        } else {
          axis = 'y'
        }
      } else if (axis === 'y') {
        const strongX = Math.abs(deltaX) > 4 && Math.abs(deltaX) > Math.abs(deltaY) * 2
        if (!strongX || scrollsHorizontally(event.target, deltaX)) return
        startHorizontal(deltaX)
      } else {
        const dir = Math.sign(deltaX)
        if (dir !== 0 && dir !== sign) {
          if (!committed) paint(0)
          startHorizontal(deltaX)
        } else {
          total += deltaX
        }
      }

      if (axis !== 'x' || !allowed(sign)) return
      event.preventDefault()
      if (committed) return
      paint(total)
      if (Math.abs(total) < COMMIT_PX) return
      committed = true
      if (sign > 0) leftRef.current?.()
      else rightRef.current?.()
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.clearTimeout(gapTimer)
      if (!committed) springBack()
    }
  }, [enabled, target])
}
