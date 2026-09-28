import { useEffect, useRef, useState, type RefObject } from 'react'

function shadowOf(el: Element): ShadowRoot | null {
  if (el.shadowRoot) return el.shadowRoot
  const closed = (el as Element & { shadow?: ShadowRoot | null }).shadow
  return closed ?? null
}

function findCanvas(root: ParentNode): HTMLCanvasElement | null {
  const here = root.querySelector('canvas')
  if (here instanceof HTMLCanvasElement && here.width > 0 && here.height > 0) {
    return here
  }
  if (root instanceof Element) {
    const own = shadowOf(root)
    if (own) {
      const nested = findCanvas(own)
      if (nested) return nested
    }
  }
  for (const el of root.querySelectorAll('*')) {
    const nestedRoot = shadowOf(el)
    if (!nestedRoot) continue
    const nested = findCanvas(nestedRoot)
    if (nested) return nested
  }
  return null
}

function isPainted(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  const { width, height } = canvas
  if (width < 2 || height < 2) return false
  const { data } = ctx.getImageData(0, 0, width, height)
  for (let i = 0; i < data.length; i += 64) {
    if (data[i + 3] < 8) continue
    if (data[i] > 24 || data[i + 1] > 24 || data[i + 2] > 24) return true
  }
  return false
}

function copyFrame(src: HTMLCanvasElement, dest: HTMLCanvasElement): boolean {
  try {
    if (dest.width !== src.width || dest.height !== src.height) {
      dest.width = src.width
      dest.height = src.height
    }
    const ctx = dest.getContext('2d')
    if (!ctx) return false
    ctx.clearRect(0, 0, dest.width, dest.height)
    ctx.drawImage(src, 0, 0)
    return isPainted(dest)
  } catch {
    return false
  }
}

/*
  WebGL clears after present, so toBlob on the live player is often blank.
  Copy into a 2D canvas on the same frame the buffer is still valid.
*/
export function usePreviewCapture(
  hostRef: RefObject<HTMLElement | null>,
  needed: boolean,
): { ready: boolean; snapshot: () => HTMLCanvasElement | null } {
  const destRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(!needed)

  useEffect(() => {
    if (!needed) {
      setReady(true)
      return
    }

    setReady(false)
    destRef.current ??= document.createElement('canvas')
    let raf = 0
    let live = true
    let painted = false

    const tick = () => {
      if (!live) return
      const host = hostRef.current
      const src = host ? findCanvas(host) : null
      if (src && copyFrame(src, destRef.current!) && !painted) {
        painted = true
        setReady(true)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      live = false
      cancelAnimationFrame(raf)
    }
  }, [hostRef, needed])

  return {
    ready,
    snapshot: () => (needed && ready ? destRef.current : null),
  }
}
