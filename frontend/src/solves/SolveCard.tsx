import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePreviewCapture } from '../preview/capturePreview'
import type { ScrambleType } from '../scramble/types'
import { buildSolveCardModel, solveCardFileName } from './cardModel'
import { renderSolveCardPng } from './renderSolveCard'
import {
  canCopyImage,
  canShareImageFile,
  copySolvePng,
  ignoreShareAbort,
  saveSolvePng,
  sendSolvePng,
} from './shareSolveCard'
import SolveCardFace from './SolveCardFace'
import type { Solve } from './types'

type SolveCardProps = {
  solves: readonly Solve[]
  solveId: string
  event: string
  sessionName: string
  scrambleType: ScrambleType
  onClose: () => void
}

type CardAction = 'send' | 'save' | 'copy'

/*
  Overlay chrome stays outside the glass face so Send / Save / Copy never
  land in the PNG. The image is a separate 2D render, not a screenshot.
*/
export default function SolveCard({
  solves,
  solveId,
  event,
  sessionName,
  scrambleType,
  onClose,
}: SolveCardProps) {
  const previewHostRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<CardAction | null>(null)
  const [caps, setCaps] = useState({ send: false, copy: false })
  const model = buildSolveCardModel(
    solves,
    solveId,
    event,
    sessionName,
    scrambleType,
  )
  const { ready: cubeReady, snapshot } = usePreviewCapture(
    previewHostRef,
    Boolean(model?.scramble),
  )

  useEffect(() => {
    setCaps({
      send: canShareImageFile(),
      copy: canCopyImage(),
    })
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!model) return null

  const exportReady = !model.scramble || cubeReady

  const run = async (action: CardAction) => {
    if (!exportReady || busy) return
    setBusy(action)
    try {
      const blob = await renderSolveCardPng(model, snapshot())
      const filename = solveCardFileName(model.timeLabel)
      if (action === 'send') await sendSolvePng(blob, filename)
      else if (action === 'save') await saveSolvePng(blob, filename)
      else await copySolvePng(blob)
    } catch (error) {
      if (ignoreShareAbort(error)) return
    } finally {
      setBusy(null)
    }
  }

  return createPortal(
    <div
      data-solve-card-overlay
      className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/80 px-5 py-8 backdrop-blur-sm"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[20rem] flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <SolveCardFace
          model={model}
          event={event}
          scrambleType={scrambleType}
          previewHostRef={previewHostRef}
        />
        <div className="flex gap-6 text-sm text-text-muted">
          {caps.send ? (
            <ActionButton
              action="send"
              label="send"
              busy={busy}
              disabled={!exportReady}
              onClick={() => void run('send')}
            />
          ) : null}
          <ActionButton
            action="save"
            label="save"
            busy={busy}
            disabled={!exportReady}
            onClick={() => void run('save')}
          />
          {caps.copy ? (
            <ActionButton
              action="copy"
              label="copy"
              busy={busy}
              disabled={!exportReady}
              onClick={() => void run('copy')}
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function ActionButton({
  action,
  label,
  busy,
  disabled,
  onClick,
}: {
  action: CardAction
  label: string
  busy: CardAction | null
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-action={action}
      disabled={disabled || Boolean(busy)}
      onClick={onClick}
      className="disabled:text-text-muted/50"
    >
      {busy === action ? '…' : label}
    </button>
  )
}
