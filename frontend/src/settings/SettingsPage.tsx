import { useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ganTimerSupported } from './chrome'
import type { SettingsOutletContext, TimerInputMode } from './types'

const MODES: { id: TimerInputMode; label: string }[] = [
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'manual', label: 'Manual' },
  { id: 'gan', label: 'Gan Timer' },
]

export default function SettingsPage() {
  const {
    inputMode,
    setInputMode,
    ganStatus,
    connectGan,
    hideTimeDuringSolve,
    setHideTimeDuringSolve,
  } = useOutletContext<SettingsOutletContext>()
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
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/25 px-6 backdrop-blur-sm"
      onClick={() => navigate('/')}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-md rounded-3xl border border-text/10 bg-bg/40 p-8 text-text backdrop-blur-xl"
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
            const ganLocked = mode.id === 'gan' && !ganTimerSupported()
            return (
              <button
                type="button"
                key={mode.id}
                data-input-mode={mode.id}
                data-gan-status={mode.id === 'gan' ? ganStatus : undefined}
                disabled={ganLocked}
                aria-disabled={ganLocked || undefined}
                onClick={() => {
                  if (ganLocked) return
                  if (mode.id === 'gan') {
                    void connectGan()
                    return
                  }
                  setInputMode(mode.id)
                }}
                className={`flex w-full items-baseline justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-lg transition-colors ${
                  ganLocked
                    ? 'cursor-default text-text-muted'
                    : selected
                      ? 'bg-text/10 text-accent'
                      : 'text-text hover:bg-text/5'
                }`}
              >
                <span>{mode.label}</span>
                {ganLocked ? (
                  <span className="text-sm text-text-muted">Chrome only</span>
                ) : null}
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-xs uppercase tracking-wide text-text-muted">timer</p>
        <button
          type="button"
          role="switch"
          aria-checked={hideTimeDuringSolve}
          data-hide-time
          onClick={() => setHideTimeDuringSolve(!hideTimeDuringSolve)}
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-lg text-text hover:bg-text/5"
        >
          hide time
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-out motion-reduce:transition-none ${
              hideTimeDuringSolve ? 'bg-accent' : 'bg-text/15'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-text shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.22,1.4,0.36,1)] motion-reduce:transition-none ${
                hideTimeDuringSolve ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
        <p className="mt-1 px-3 text-sm text-text-muted">
          while a solve is running, the digits stay off
        </p>
      </div>
    </div>
  )
}
