import { useState } from 'react'
import type { ScrambleType } from '../scramble/types'
import { defaultSessionName, eventLabel, WCA_EVENTS } from './events'
import type { Session, SessionPanel as Panel } from './types'

const SCRAMBLE_TYPES: ScrambleType[] = ['WCA']

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
    if (!nameTouched) setDraftName(defaultSessionName(event))
  }

  const confirmCreate = () => {
    onCreate(draftName, draftEvent, draftType)
    onPanel('none')
  }

  return (
    <div data-session-ui>
      <p className="text-xs uppercase tracking-wide text-text-muted">session</p>
      <button
        type="button"
        tabIndex={-1}
        data-session-name
        onClick={() => onPanel(panel === 'switcher' ? 'none' : 'switcher')}
        className="mt-1 block text-left text-base text-text"
      >
        {active.name}
      </button>
      <button
        type="button"
        tabIndex={-1}
        data-new-session
        onClick={openCreate}
        className="mt-2 border border-border px-2 py-1 text-sm text-text-muted"
      >
        new session
      </button>

      {panel === 'switcher' && (
        <div className="mt-3 flex flex-col items-start gap-1 text-sm text-text-dim">
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
        </div>
      )}

      {panel === 'create' && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-bg/80"
          onClick={() => onPanel('none')}
        >
          <div
            data-session-create
            className="w-full max-w-md bg-elevated p-6 text-left"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-wide text-text-muted">new session</p>

            <label className="mt-4 block text-xs text-text-muted" htmlFor="session-name">
              name
            </label>
            <input
              id="session-name"
              data-session-name-input
              tabIndex={-1}
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
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {SCRAMBLE_TYPES.map((type) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={type}
                  data-create-type={type}
                  onClick={() => setDraftType(type)}
                  className={draftType === type ? 'text-accent' : 'text-text-muted'}
                >
                  {type}
                </button>
              ))}
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
        </div>
      )}
    </div>
  )
}
