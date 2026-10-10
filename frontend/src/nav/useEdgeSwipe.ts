import { useEffect, useRef } from 'react'

const EDGE_PX = 24
const MIN_DX = 56
const LAST_ALGS_KEY = 'cubr.lastAlgs'

function isPhone(): boolean {
  return window.matchMedia('(max-width: 767px)').matches
}

function isEdgeStart(clientX: number): boolean {
  return clientX <= EDGE_PX || clientX >= window.innerWidth - EDGE_PX
}

export function rememberAlgsPath(pathname: string) {
  try {
    window.sessionStorage.setItem(LAST_ALGS_KEY, pathname)
  } catch {
    // private mode / blocked storage
  }
}

export function lastAlgsPath(): string {
  try {
    const value = window.sessionStorage.getItem(LAST_ALGS_KEY)
    if (value === '/algs/pll' || value === '/algs/oll' || value === '/algs') {
      return value
    }
  } catch {
    // private mode / blocked storage
  }
  return '/algs'
}

type EdgeSwipe = {
  enabled: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function useEdgeSwipe({ enabled, onSwipeLeft, onSwipeRight }: EdgeSwipe) {
  const leftRef = useRef(onSwipeLeft)
  const rightRef = useRef(onSwipeRight)

  useEffect(() => {
    leftRef.current = onSwipeLeft
    rightRef.current = onSwipeRight
  }, [onSwipeLeft, onSwipeRight])

  useEffect(() => {
    if (!enabled) return

    let tracking = false
    let pointerId: number | null = null
    let startX = 0
    let startY = 0

    const onDown = (event: PointerEvent) => {
      if (!event.isPrimary || !isPhone()) return
      if (!isEdgeStart(event.clientX)) return
      tracking = true
      pointerId = event.pointerId
      startX = event.clientX
      startY = event.clientY
    }

    const end = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== pointerId) return
      tracking = false
      pointerId = null
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      if (Math.abs(dx) <= MIN_DX || Math.abs(dx) <= 1.5 * Math.abs(dy)) return
      if (dx < 0) leftRef.current?.()
      else rightRef.current?.()
    }

    document.addEventListener('pointerdown', onDown)
    document.addEventListener('pointerup', end)
    document.addEventListener('pointercancel', end)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerup', end)
      document.removeEventListener('pointercancel', end)
    }
  }, [enabled])
}
