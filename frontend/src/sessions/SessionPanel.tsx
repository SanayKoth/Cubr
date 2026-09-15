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
          className="order-2 shrink-0 text-sm text-text-muted max-md:rounded-xl max-md:px-2.5 max-md:py-2 max-md:bg-text/8 md:order-none md:mt-1 md:border md:border-border md:px-2 md:py-1"
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
          className="flex w-full cursor-pointer items-center justify-between gap-2 bg-transparent text-left text-base text-text outline-none max-md:rounded-xl max-md:bg-text/8 max-md:py-2 max-md:pr-3 max-md:pl-3 md:border md:border-border md:py-1 md:pr-2 md:pl-2"
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
            className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto overscroll-contain border border-border bg-elevated py-1 max-md:rounded-xl"
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
                    className={`w-full truncate px-2 py-1.5 text-left text-base ${
                      selected ? 'text-accent' : 'text-text-muted'
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) onPanel('none')
            }}
          >
            <div
              className="w-full max-w-md bg-elevated p-6 text-left"
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
              className="mt-1 w-full border-b border-border bg-transparent pb-1 text-text outline-none"
            />

            <p className="mt-5 text-xs text-text-muted">event</p>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {WCA_EVENTS.map((entry) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={entry.id}
                  data-create-event={entry.id}
                  onClick={() => pickEvent(entry.id)}
                  className={draftEvent === entry.id ? 'text-accent' : 'text-text-muted'}
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
                onPick={setDraftType}
              />
            </div>

            <div className="mt-6 flex gap-4 text-sm">
              <button
                type="button"
                tabIndex={-1}
                data-create-confirm
                onClick={confirmCreate}
                className="text-text"
              >
                create
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => onPanel('none')}
                className="text-text-muted"
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
