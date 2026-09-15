import { useEffect, useRef } from 'react'
import { TwistyPlayer, type ExperimentalStickering } from 'cubing/twisty'
import { puzzleIdForEvent } from './puzzle'
import { startWhenSized } from './startPlayer'
import './preview.css'

type ScramblePreviewProps = {
  event: string
  moves: string
  stickering: string | null
}

function stickeringRequest(stickering: string | null): ExperimentalStickering {
  return (stickering ?? 'full') as ExperimentalStickering
}

export default function ScramblePreview({ event, moves, stickering }: ScramblePreviewProps) {
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
      experimentalStickering: stickeringRequest(stickering),
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
    player.experimentalStickering = stickeringRequest(stickering)
    player.experimentalSetupAlg = moves
  }, [event, moves, stickering])

  return (
    <div
      ref={hostRef}
      data-scramble-preview
      className="h-full w-full"
    />
  )
}
