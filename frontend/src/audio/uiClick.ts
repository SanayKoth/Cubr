import { useEffect } from 'react'
import { audioContext, warmAudio } from './context'

const TARGET = 'button, a[href], [role="switch"]'
const COOLDOWN_MS = 48

let lastPlayed = 0
let noise: AudioBuffer | null = null

function noiseBurst(next: AudioContext): AudioBuffer {
  const length = Math.floor(next.sampleRate * 0.012)
  if (noise && noise.sampleRate === next.sampleRate && noise.length === length) {
    return noise
  }
  noise = next.createBuffer(1, length, next.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2
  }
  return noise
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
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + duration)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.0012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(next.destination)
  osc.start(start)
  osc.stop(start + duration + 0.006)
}

export type UiClickKind = 'press' | 'on' | 'off'

/*
  Short tactile tick — quieter and sharper than the inspection cues so
  chrome never competes with the 8s / 12s beeps.
*/
export function playUiClick(kind: UiClickKind = 'press') {
  const next = audioContext()
  if (!next) return
  const now = performance.now()
  if (now - lastPlayed < COOLDOWN_MS) return
  lastPlayed = now
  if (next.state === 'suspended') void next.resume()

  const t = next.currentTime
  const tip = kind === 'on' ? 3200 : kind === 'off' ? 2300 : 2800

  tone(next, t, tip, 0.016, 0.008)

  const grain = next.createBufferSource()
  grain.buffer = noiseBurst(next)
  const filter = next.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(kind === 'off' ? 2600 : 3400, t)
  filter.Q.setValueAtTime(3.4, t)
  const grainAmp = next.createGain()
  grainAmp.gain.setValueAtTime(0.0001, t)
  grainAmp.gain.exponentialRampToValueAtTime(0.012, t + 0.0008)
  grainAmp.gain.exponentialRampToValueAtTime(0.0001, t + 0.011)
  grain.connect(filter)
  filter.connect(grainAmp)
  grainAmp.connect(next.destination)
  grain.start(t)
  grain.stop(t + 0.014)
}

function clickKind(el: Element): UiClickKind {
  if (el.getAttribute('role') !== 'switch') return 'press'
  return el.getAttribute('aria-checked') === 'true' ? 'off' : 'on'
}

function isArmedControl(el: Element): boolean {
  if (el.closest('[aria-disabled="true"]')) return false
  if (el instanceof HTMLButtonElement && el.disabled) return false
  if (el instanceof HTMLAnchorElement && !el.href) return false
  return true
}

export function useUiClickSounds() {
  useEffect(() => {
    const onPointerDown = () => warmAudio()
    const onClick = (event: MouseEvent) => {
      const el = (event.target as Element | null)?.closest(TARGET)
      if (!el || !isArmedControl(el)) return
      playUiClick(clickKind(el))
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('click', onClick, true)
    }
  }, [])
}
