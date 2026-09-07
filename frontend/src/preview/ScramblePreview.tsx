import { useEffect, useRef } from 'react'
import { TwistyPlayer } from 'cubing/twisty'
import { puzzleIdForEvent } from './puzzle'
import './preview.css'

type ScramblePreviewProps = {
  event: string
  moves: string
}

function startVisualization(player: TwistyPlayer) {
  let proto: object | null = Object.getPrototypeOf(player)
  while (proto && proto !== Object.prototype) {
    const symbol = Object.getOwnPropertySymbols(proto).find(
      (key) => String(key) === 'Symbol(intersectedCallback)',
    )
    if (symbol) {
      const start = Reflect.get(proto, symbol)
      if (typeof start === 'function') {
        start.call(player)
        return
      }
    }
    proto = Object.getPrototypeOf(proto)
  }
}

function startWhenSized(player: TwistyPlayer): () => void {
  const tryStart = () => {
    if (player.clientHeight > 0) {
      startVisualization(player)
      return true
    }
    return false
  }

  if (tryStart()) return () => {}

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting && entry.intersectionRect.height > 0)) {
      startVisualization(player)
      observer.disconnect()
    }
  })
  observer.observe(player)
  requestAnimationFrame(() => {
    if (tryStart()) observer.disconnect()
  })
  return () => observer.disconnect()
}

export default function ScramblePreview({ event, moves }: ScramblePreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TwistyPlayer | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const player = new TwistyPlayer({
      alg: '',
      experimentalSetupAlg: moves,
      puzzle: puzzleIdForEvent(event),
      controlPanel: 'none',
      viewerLink: 'none',
      experimentalMovePressInput: 'none',
      background: 'none',
      backView: 'none',
      hintFacelets: 'floating',
    })
    player.style.width = '100%'
    player.style.height = '100%'
    player.style.display = 'grid'

    host.appendChild(player)
    playerRef.current = player
    const stopWaiting = startWhenSized(player)

    return () => {
      stopWaiting()
      player.remove()
      if (playerRef.current === player) playerRef.current = null
    }
    // Player is reused; event/moves are applied in the effect below.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    player.puzzle = puzzleIdForEvent(event)
    player.experimentalSetupAlg = moves
  }, [event, moves])

  return (
    <div
      ref={hostRef}
      data-scramble-preview
      className="h-full w-full"
    />
  )
}
