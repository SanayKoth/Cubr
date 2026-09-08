let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  ctx ??= new AudioContext()
  return ctx
}

export function warmInspectionSound() {
  const next = audio()
  if (next?.state === 'suspended') void next.resume()
}

function tone(
  next: AudioContext,
  start: number,
  frequency: number,
  duration: number,
  gain: number,
) {
  const osc = next.createOscillator()
  const amp = next.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(amp)
  amp.connect(next.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

/*
  Quiet Stackmat-style ticks, played on the inspection-cue frame.
  SpeechSynthesis is too slow, too loud, and usually a novelty voice.
*/
export function playInspectionCue(seconds: 8 | 12) {
  const next = audio()
  if (!next) return
  if (next.state === 'suspended') void next.resume()
  const t = next.currentTime
  if (seconds === 8) {
    tone(next, t, 784, 0.12, 0.06)
    return
  }
    tone(next, t, 988, 0.09, 0.06)
    tone(next, t + 0.16, 988, 0.09, 0.06)
}
