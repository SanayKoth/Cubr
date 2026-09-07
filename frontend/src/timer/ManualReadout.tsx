import { useCallback, useEffect, useRef, useState } from 'react'
import { parseManualTime } from './parseManualTime'

type ManualReadoutProps = {
  onRecord: (timeMs: number) => void
  paused: boolean
}

export default function ManualReadout({ onRecord, paused }: ManualReadoutProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const clearDraft = useCallback(() => {
    setDraft('')
  }, [])

  useEffect(() => {
    if (paused) {
      inputRef.current?.blur()
      return
    }
    inputRef.current?.focus()
  }, [paused])

  useEffect(() => {
    if (paused) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.target instanceof HTMLInputElement && event.target.dataset.manualInput === undefined) {
        return
      }
      event.preventDefault()
      clearDraft()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearDraft, paused])

  return (
    <div className="rounded-lg border border-border px-6 py-2">
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-manual-input
        size={6}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          const timeMs = parseManualTime(draft)
          if (timeMs === null) return
          onRecord(timeMs)
          setDraft('')
        }}
        className="w-[4em] bg-transparent font-sans text-timer text-text timer-figures text-center outline-none select-text"
      />
    </div>
  )
}
