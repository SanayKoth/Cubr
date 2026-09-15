import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

type AppDockProps = {
  hidden?: boolean
  leading?: ReactNode
}

const ITEMS = [
  { to: '/', label: 'Timer', end: true, test: 'timer' as const, icon: TimerIcon },
  { to: '/algs', label: 'Algs', end: false, test: 'algs' as const, icon: AlgsIcon },
  { to: '/settings', label: 'Settings', end: true, test: 'settings' as const, icon: SettingsIcon },
]

export default function AppDock({ hidden = false, leading }: AppDockProps) {
  return (
    <nav
      data-app-dock
      aria-label="app"
      aria-hidden={hidden}
      className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 max-md:right-[max(0.75rem,env(safe-area-inset-right))] md:left-1/2 md:-translate-x-1/2 ${
        hidden
          ? 'pointer-events-none opacity-0 transition-opacity duration-500 ease-out'
          : 'opacity-100 transition-opacity duration-500 ease-out'
      }`}
    >
      <div className="flex items-end gap-2">
        {leading ? <div className="md:hidden">{leading}</div> : null}
        <ul className="glass-dock flex origin-bottom-right items-center gap-1 rounded-2xl px-2 py-1 transition-transform duration-200 ease-out motion-reduce:transition-none md:origin-bottom [@media(hover:hover)]:hover:scale-110">
          {ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  data-algs={item.test === 'algs' ? '' : undefined}
                  data-settings={item.test === 'settings' ? '' : undefined}
                  tabIndex={hidden ? -1 : undefined}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    `group/item relative flex size-10 items-center justify-center rounded-full outline-none transition-colors ${
                      isActive ? 'text-accent' : 'text-text-muted hover:text-text'
                    }`
                  }
                >
                  <Icon />
                  <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-bg/90 px-2 py-0.5 text-[11px] tracking-wide text-text-dim opacity-0 transition-opacity [@media(hover:hover)]:group-hover/item:opacity-100">
                    {item.label}
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

function TimerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <circle cx="12" cy="12" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8.5v4l2.5 1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AlgsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <rect x="5" y="5" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.5" y="5" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="5" y="13.5" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13.5" y="13.5" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
