import { useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { SettingsOutletContext, TimerInputMode } from './types'

const MODES: { id: TimerInputMode; label: string }[] = [
  { id: 'keyboard', label: 'keyboard' },
  { id: 'manual', label: 'manual' },
]

export default function SettingsPage() {
  const { inputMode, setInputMode } = useOutletContext<SettingsOutletContext>()
  const navigate = useNavigate()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      navigate('/')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div
      data-settings
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/90 px-6"
      onClick={() => navigate('/')}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-md rounded-2xl border border-text-muted bg-interactive p-8 text-text"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="settings-title" className="text-xl text-text">
            settings
          </h2>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-text-dim"
          >
            close
          </button>
        </div>

        <p className="mt-8 text-xs uppercase tracking-wide text-text-muted">input</p>
        <div className="mt-3 flex flex-col gap-1">
          {MODES.map((mode) => {
            const selected = inputMode === mode.id
            return (
              <button
                type="button"
                key={mode.id}
                data-input-mode={mode.id}
                onClick={() => setInputMode(mode.id)}
                className={`w-full px-3 py-2.5 text-left text-lg ${
                  selected ? 'bg-elevated text-accent' : 'text-text'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
