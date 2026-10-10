import { useState } from 'react'
import { createPortal } from 'react-dom'
import { allowedTypes } from '../scramble/catalog'
import ScrambleTypeGroups from '../scramble/TypeGroups'
import type { ScrambleType } from '../scramble/types'
import { defaultSessionName, WCA_EVENTS } from './events'
import type { Session, SessionPanel as Panel } from './types'

type SessionPanelProps = {
  sessions: Session[]
  active: Session
  panel: Panel
  onPanel: (panel: Panel) => void
  onSwitch: (id: string) => void
  onCreate: (name: string, event: string, scrambleType: ScrambleType) => void
}

export default function SessionPanel({
  sessions,
  active,
  panel,
  onPanel,
  onSwitch,
  onCreate,
}: SessionPanelProps) {
  const [draftName, setDraftName] = useState(defaultSessionName('333'))
  const [draftEvent, setDraftEvent] = useState('333')
  const [draftType, setDraftType] = useState<ScrambleType>('WCA')
  const [nameTouched, setNameTouched] = useState(false)

  const openCreate = () => {
    setDraftEvent('333')
    setDraftType('WCA')
    setDraftName(defaultSessionName('333'))
    setNameTouched(false)
    onPanel('create')
  }

  const pickEvent = (event: string) => {
    setDraftEvent(event)
    setDraftType((type) => (allowedTypes(event).includes(type) ? type : 'WCA'))
    if (!nameTouched) setDraftName(defaultSessionName(event))
  }

  const confirmCreate = () => {
    onCreate(draftName, draftEvent, draftType)
    onPanel('none')
  }

  const listed = [...sessions].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )

  return (
    <div data-session-ui>
      <div className="flex items-center gap-2 md:block">
        <p className="hidden text-xs uppercase tracking-wide text-text-muted md:block">
          session
        </p>
        <button
          type="button"
          tabIndex={-1}
          data-new-session
          onClick={openCreate}
          className="glass-dock order-2 shrink-0 rounded-2xl px-3 py-2 text-sm text-text-muted md:order-none md:mt-1 [@media(hover:hover)]:hover:bg-text/10 [@media(hover:hover)]:hover:text-text"
        >
          <span className="md:hidden">new</span>
          <span className="hidden md:inline">new session</span>
        </button>
        <div className="relative order-1 min-w-0 flex-1 md:order-none md:mt-2">
        <button
          type="button"
          tabIndex={-1}
          data-session-name
          aria-label="session"
          aria-haspopup="listbox"
          aria-expanded={panel === 'session'}
          onClick={() => onPanel(panel === 'session' ? 'none' : 'session')}
          className="glass-dock flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl py-2 pr-3 pl-3 text-left text-base text-text outline-none"
        >
          <span className="min-w-0 truncate">{active.name}</span>
          <span aria-hidden="true" className="text-text-muted">
            ▾
          </span>
        </button>
        {panel === 'session' && (
          <ul
            role="listbox"
            aria-label="session"
            className="absolute z-10 mt-1 flex max-h-48 w-full flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-2xl border border-text/10 bg-bg/90 p-1 backdrop-blur-xl"
          >
            {listed.map((session) => {
              const selected = session.id === active.id
              return (
                <li key={session.id} role="none">
                  <button
                    type="button"
                    tabIndex={-1}
                    role="option"
                    aria-selected={selected}
                    data-session-option={session.id}
                    onClick={() => {
                      onSwitch(session.id)
                      onPanel('none')
                    }}
                    className={`w-full truncate rounded-xl px-3 py-2 text-left text-base transition-colors ${
                      selected
                        ? 'bg-text/10 text-accent'
                        : 'text-text-muted [@media(hover:hover)]:hover:bg-text/5 [@media(hover:hover)]:hover:text-text'
                    }`}
                  >
                    {session.name}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        </div>
      </div>

      {panel === 'create' &&
        createPortal(
          <div
            data-session-create
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/25 px-6 backdrop-blur-sm"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onPanel('none')
            }}
          >
            <div
              className="w-full max-w-md rounded-3xl border border-text/10 bg-bg/40 p-8 text-left backdrop-blur-xl"
              onPointerDown={(event) => event.stopPropagation()}
            >
            <p className="text-xs uppercase tracking-wide text-text-muted">new session</p>

            <label className="mt-4 block text-xs text-text-muted" htmlFor="session-name">
              name
            </label>
            <input
              id="session-name"
              data-session-name-input
              autoFocus
              value={draftName}
              onChange={(event) => {
                setNameTouched(true)
                setDraftName(event.target.value)
              }}
              className="mt-1 w-full rounded-2xl border border-text/10 bg-text/5 px-3 py-2 text-text outline-none transition-colors focus:border-text/25"
            />

            <p className="mt-5 text-xs text-text-muted">event</p>
            <div className="mt-2 flex flex-wrap gap-1 text-sm">
              {WCA_EVENTS.map((entry) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={entry.id}
                  data-create-event={entry.id}
                  onClick={() => pickEvent(entry.id)}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    draftEvent === entry.id
                      ? 'bg-text/10 text-accent'
                      : 'text-text-muted [@media(hover:hover)]:hover:bg-text/5 [@media(hover:hover)]:hover:text-text'
                  }`}
                >
                  {entry.label}
                </button>
              ))}
            </div>

            <p className="mt-5 text-xs text-text-muted">scramble type</p>
            <div className="mt-2 text-sm">
              <ScrambleTypeGroups
                event={draftEvent}
                selected={draftType}
                optionAttr="data-create-type"
                layout="wrap"
                onPick={setDraftType}
              />
            </div>

            <div className="mt-6 flex items-center gap-4 text-sm">
              <button
                type="button"
                tabIndex={-1}
                data-create-confirm
                onClick={confirmCreate}
                className="glass-dock rounded-full px-4 py-2 text-sm text-text transition-colors [@media(hover:hover)]:hover:bg-text/10"
              >
                create
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onPanel('none')}
                className="text-sm text-text-muted transition-colors [@media(hover:hover)]:hover:text-text-dim"
              >
                cancel
              </button>
            </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
