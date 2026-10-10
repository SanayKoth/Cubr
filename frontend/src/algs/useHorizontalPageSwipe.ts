import { useEffect, useRef, type RefObject } from 'react'

const MIN_DX = 56
const EDGE_PX = 24

function isPhone(): boolean {
  return window.matchMedia('(max-width: 767px)').matches
}

type PageSwipe = {
  enabled: boolean
  onPrev: () => void
  onNext: () => void
}

export function useHorizontalPageSwipe(
  target: RefObject<HTMLElement | null>,
  { enabled, onPrev, onNext }: PageSwipe,
) {
  const prevRef = useRef(onPrev)
  const nextRef = useRef(onNext)

  useEffect(() => {
    prevRef.current = onPrev
    nextRef.current = onNext
  }, [onPrev, onNext])

  useEffect(() => {
    const node = target.current
    if (!enabled || !node) return

    let tracking = false
    let pointerId: number | null = null
    let startX = 0
    let startY = 0
    let swiped = false

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || !isPhone()) return
      if (event.clientX <= EDGE_PX || event.clientX >= window.innerWidth - EDGE_PX) {
        return
      }
      tracking = true
      pointerId = event.pointerId
      startX = event.clientX
      startY = event.clientY
      swiped = false
    }

    const onUp = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return
      tracking = false
      pointerId = null
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      if (Math.abs(dx) <= MIN_DX || Math.abs(dx) <= 1.5 * Math.abs(dy)) return
      swiped = true
      if (dx < 0) nextRef.current()
      else prevRef.current()
    }

    const onClick = (event: MouseEvent) => {
      if (!swiped) return
      event.preventDefault()
      event.stopPropagation()
      swiped = false
    }

    node.addEventListener('pointerdown', onDown)
    node.addEventListener('pointerup', onUp)
    node.addEventListener('pointercancel', onUp)
    node.addEventListener('click', onClick, true)
    return () => {
      node.removeEventListener('pointerdown', onDown)
      node.removeEventListener('pointerup', onUp)
      node.removeEventListener('pointercancel', onUp)
      node.removeEventListener('click', onClick, true)
    }
  }, [enabled, target])
}
