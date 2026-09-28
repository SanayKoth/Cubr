function probeFile(): File {
  return new File([new Uint8Array([0])], 'cubr.png', { type: 'image/png' })
}

export function isAppleTouch(): boolean {
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true
  return (
    navigator.platform === 'MacIntel' &&
    navigator.maxTouchPoints > 1 &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

export function canShareImageFile(): boolean {
  try {
    return Boolean(navigator.canShare?.({ files: [probeFile()] }))
  } catch {
    return false
  }
}

export function canCopyImage(): boolean {
  if (isAppleTouch()) return false
  if (typeof ClipboardItem === 'undefined') return false
  return Boolean(navigator.clipboard?.write)
}

function asFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: 'image/png' })
}

export async function sendSolvePng(blob: Blob, filename: string): Promise<void> {
  await navigator.share({
    files: [asFile(blob, filename)],
    title: 'Cubr',
  })
}

export async function saveSolvePng(blob: Blob, filename: string): Promise<void> {
  if (isAppleTouch() && canShareImageFile()) {
    await sendSolvePng(blob, filename)
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export async function copySolvePng(blob: Blob): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export function ignoreShareAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}
