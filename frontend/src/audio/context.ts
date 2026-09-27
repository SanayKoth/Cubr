let ctx: AudioContext | null = null

export function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  ctx ??= new AudioContext()
  return ctx
}

export function warmAudio() {
  const next = audioContext()
  if (next?.state === 'suspended') void next.resume()
}
