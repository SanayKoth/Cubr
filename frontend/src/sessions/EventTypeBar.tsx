import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { scrambleTypeLabel } from '../scramble/catalog'
import ScrambleTypeGroups from '../scramble/TypeGroups'
import type { ScrambleType } from '../scramble/types'
import { eventLabel, WCA_EVENTS } from './events'
import type { Session, SessionPanel as Panel } from './types'

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
  const hostRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const open = panel === 'event' || panel === 'type'

  useLayoutEffect(() => {
    if (!open) return

    const place = () => {
      const box = hostRef.current?.getBoundingClientRect()
      const menu = menuRef.current
      if (!box || !menu) return
      menu.style.top = `${box.bottom + 8}px`
      menu.style.left = `${box.left + box.width / 2}px`
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, panel])

  return (
    <div ref={hostRef} data-scramble-meta className="text-sm">
      <div className="flex items-center justify-center gap-3 text-text-muted">
        <button
          type="button"
          tabIndex={-1}
          data-session-event
          aria-haspopup="listbox"
          aria-expanded={panel === 'event'}
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
          aria-haspopup="listbox"
          aria-expanded={panel === 'type'}
          onClick={() => onPanel(panel === 'type' ? 'none' : 'type')}
          className={panel === 'type' ? 'text-accent' : ''}
        >
          {scrambleTypeLabel(active.scrambleType)}
        </button>
      </div>

      {open &&
        createPortal(
          <>
            <div
              data-scramble-picker
              className="fixed inset-0 z-50 bg-bg/80"
              onPointerDown={() => onPanel('none')}
            />
            <div
              ref={menuRef}
              data-scramble-picker
              role="listbox"
              aria-label={panel === 'event' ? 'event' : 'scramble type'}
              className="fixed z-50 max-h-64 w-44 -translate-x-1/2 overflow-y-auto overscroll-contain border border-border bg-elevated py-1"
              onPointerDown={(event) => event.stopPropagation()}
            >
              {panel === 'event' ? (
                WCA_EVENTS.map((entry) => (
                  <button
                    type="button"
                    tabIndex={-1}
                    key={entry.id}
                    role="option"
                    aria-selected={active.event === entry.id}
                    data-event-option={entry.id}
                    onClick={() => {
                      onChangeEvent(entry.id)
                      onPanel('none')
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm ${
                      active.event === entry.id ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    {entry.label}
                  </button>
                ))
              ) : (
                <ScrambleTypeGroups
                  event={active.event}
                  selected={active.scrambleType}
                  optionAttr="data-type-option"
                  onPick={(type) => {
                    onChangeType(type)
                    onPanel('none')
                  }}
                />
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}
