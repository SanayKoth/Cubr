import { scrambleTypeLabel, typeGroupsForEvent } from './catalog'
import type { ScrambleType } from './types'

type ScrambleTypeGroupsProps = {
  event: string
  selected: ScrambleType
  onPick: (type: ScrambleType) => void
  optionAttr: 'data-type-option' | 'data-create-type'
}

export default function ScrambleTypeGroups({
  event,
  selected,
  onPick,
  optionAttr,
}: ScrambleTypeGroupsProps) {
  const groups = typeGroupsForEvent(event)
  return (
    <div className="flex flex-col">
      {groups.map((group) => (
        <div key={group.label}>
          {group.types.length > 1 && (
            <p className="px-3 pt-2 pb-0.5 text-xs text-text-muted">{group.label}</p>
          )}
          {group.types.map((type) => (
            <button
              type="button"
              tabIndex={-1}
              key={type}
              {...{ [optionAttr]: type }}
              onClick={() => onPick(type)}
              className={`w-full px-3 py-1.5 text-left text-sm ${
                selected === type ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {scrambleTypeLabel(type)}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
