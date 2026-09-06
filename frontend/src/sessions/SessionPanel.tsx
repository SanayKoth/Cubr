import { useState } from 'react'
import { eventLabel, WCA_EVENTS } from './events'
import type { Session, SessionPanel as Panel } from './types'

type SessionPanelProps = {
  sessions: Session[]
  active: Session
  panel: Panel
  onPanel: (panel: Panel) => void
  onSwitch: (id: string) => void
  onCreate: (name: string, event: string) => void
  onChangeEvent: (event: string) => void
}

export default function SessionPanel({
  sessions,
  active,
  panel,
  onPanel,
  onSwitch,
  onCreate,
  onChangeEvent,
}: SessionPanelProps) {
  const [draftName, setDraftName] = useState('')
  const [draftEvent, setDraftEvent] = useState<string | null>(null)

  const confirmCreate = () => {
    if (draftEvent === null) return
    onCreate(draftName, draftEvent)
    setDraftName('')
    setDraftEvent(null)
    onPanel('none')
  }

  return (
    <div data-session-ui className="mb-4 text-sm">
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          tabIndex={-1}
          data-session-name
          onClick={() => onPanel(panel === 'switcher' || panel === 'create' ? 'none' : 'switcher')}
          className="text-left text-text"
        >
          {active.name}
        </button>
        <button
          type="button"
          tabIndex={-1}
          data-session-event
          onClick={() => onPanel(panel === 'event' ? 'none' : 'event')}
          className="text-left text-text-muted"
        >
          <span className="text-accent">{eventLabel(active.event)}</span>
          <span> WCA</span>
        </button>
      </div>

      {panel === 'switcher' && (
        <div className="mt-3 flex flex-col items-start gap-1 text-text-dim">
          {sessions.map((session) => (
            <button
              type="button"
              tabIndex={-1}
              key={session.id}
              data-session-option={session.id}
              onClick={() => {
                onSwitch(session.id)
                onPanel('none')
              }}
              className={`text-left ${session.id === active.id ? 'text-accent' : ''}`}
            >
              {session.name}
              <span className="text-text-muted"> {eventLabel(session.event)}</span>
            </button>
          ))}
          <button
            type="button"
            tabIndex={-1}
            data-new-session
            onClick={() => {
              setDraftName('')
              setDraftEvent(null)
              onPanel('create')
            }}
            className="mt-2 text-left text-text-muted"
          >
            new session
          </button>
        </div>
      )}

      {panel === 'create' && (
        <div className="mt-3 flex flex-col items-start gap-2">
          <input
            data-session-name-input
            tabIndex={-1}
            value={draftName}
            placeholder={draftEvent ? eventLabel(draftEvent) : 'name'}
            onChange={(event) => setDraftName(event.target.value)}
            className="w-full bg-transparent text-text outline-none placeholder:text-text-muted"
          />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {WCA_EVENTS.map((entry) => (
              <button
                type="button"
                tabIndex={-1}
                key={entry.id}
                data-create-event={entry.id}
                onClick={() => setDraftEvent(entry.id)}
                className={draftEvent === entry.id ? 'text-accent' : 'text-text-muted'}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            tabIndex={-1}
            data-create-confirm
            disabled={draftEvent === null}
            onClick={confirmCreate}
            className={draftEvent === null ? 'text-text-muted' : 'text-text'}
          >
            create
          </button>
        </div>
      )}

      {panel === 'event' && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {WCA_EVENTS.map((entry) => (
            <button
              type="button"
              tabIndex={-1}
              key={entry.id}
              data-event-option={entry.id}
              onClick={() => {
                onChangeEvent(entry.id)
                onPanel('none')
              }}
              className={active.event === entry.id ? 'text-accent' : 'text-text-muted'}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
