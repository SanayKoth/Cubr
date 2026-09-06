import type { ScrambleType } from '../scramble/types'
import { eventLabel, WCA_EVENTS } from './events'
import type { Session, SessionPanel as Panel } from './types'

const SCRAMBLE_TYPES: ScrambleType[] = ['WCA']

type EventTypeBarProps = {
  active: Session
  panel: Panel
  onPanel: (panel: Panel) => void
  onChangeEvent: (event: string) => void
  onChangeType: (type: ScrambleType) => void
}

export default function EventTypeBar({
  active,
  panel,
  onPanel,
  onChangeEvent,
  onChangeType,
}: EventTypeBarProps) {
  return (
    <div data-scramble-meta className="mt-3 text-sm">
      <div className="flex items-center justify-center gap-3 text-text-muted">
        <button
          type="button"
          tabIndex={-1}
          data-session-event
          onClick={() => onPanel(panel === 'event' ? 'none' : 'event')}
          className={panel === 'event' ? 'text-accent' : ''}
        >
          {eventLabel(active.event)}
        </button>
        <span>·</span>
        <button
          type="button"
          tabIndex={-1}
          data-session-type
          onClick={() => onPanel(panel === 'type' ? 'none' : 'type')}
          className={panel === 'type' ? 'text-accent' : ''}
        >
          {active.scrambleType}
        </button>
      </div>

      {panel === 'event' && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
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

      {panel === 'type' && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {SCRAMBLE_TYPES.map((type) => (
            <button
              type="button"
              tabIndex={-1}
              key={type}
              data-type-option={type}
              onClick={() => {
                onChangeType(type)
                onPanel('none')
              }}
              className={active.scrambleType === type ? 'text-accent' : 'text-text-muted'}
            >
              {type}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
