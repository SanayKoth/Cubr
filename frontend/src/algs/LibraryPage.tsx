import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { casesForSet, parseAlgSet } from './catalog'
import CaseCard from './CaseCard'
import { ALG_SETS, OLL_GROUPS } from './types'
import { useHorizontalPageSwipe } from './useHorizontalPageSwipe'
import AppDock from '../nav/AppDock'
import { rememberAlgsPath, useEdgeSwipe } from '../nav/useEdgeSwipe'
import { useTrackpadSwipe } from '../nav/useTrackpadSwipe'
import { slideNavigate, TIMER_PAGE } from '../nav/slideNavigate'

export default function LibraryPage() {
  const { set: setParam } = useParams()
  const navigate = useNavigate()
  const listRef = useRef<HTMLElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [ollGroup, setOllGroup] = useState<string | null>(null)
  const invalidSet =
    setParam !== undefined && setParam !== 'pll' && setParam !== 'oll'
  const set = parseAlgSet(setParam)
  const cases = casesForSet(set).filter(
    (entry) => set !== 'oll' || ollGroup === null || entry.group === ollGroup,
  )

  useEffect(() => {
    if (invalidSet) return
    rememberAlgsPath(`/algs/${set}`)
  }, [invalidSet, set])

  const goToTimer = useCallback(() => {
    slideNavigate(() => navigate('/'), 'right', TIMER_PAGE)
  }, [navigate])

  const goToOll = useCallback(() => {
    navigate('/algs/oll', { replace: true })
  }, [navigate])

  const goToPll = useCallback(() => {
    navigate('/algs/pll', { replace: true })
  }, [navigate])

  useEdgeSwipe({
    enabled: !invalidSet,
    onSwipeLeft: set === 'oll' ? goToPll : undefined,
    onSwipeRight: set === 'pll' ? goToOll : goToTimer,
  })

  useTrackpadSwipe(pageRef, {
    enabled: !invalidSet,
    onSwipeRight: goToTimer,
  })

  useHorizontalPageSwipe(listRef, {
    enabled: !invalidSet,
    onPrev: () => {
      if (set === 'pll') goToOll()
    },
    onNext: () => {
      if (set === 'oll') goToPll()
    },
  })

  if (invalidSet) {
    return <Navigate to="/algs/oll" replace />
  }

  return (
    <div ref={pageRef} data-algs-page className="flex h-full flex-col bg-bg font-sans text-text">
      <div
        data-edge-swipe
        aria-hidden
        className="fixed inset-y-0 left-0 z-10 w-6 md:hidden"
      />
      <div
        data-edge-swipe
        aria-hidden
        className="fixed inset-y-0 right-0 z-10 w-6 md:hidden"
      />
      <header className="shrink-0 px-[max(1.5rem,env(safe-area-inset-left))] pt-[max(1.25rem,env(safe-area-inset-top))] pr-[max(1.5rem,env(safe-area-inset-right))]">
        <Link to="/" className="font-brand text-xl text-text md:text-3xl">
          Cubr
        </Link>
        <nav data-alg-sets className="glass-dock mx-auto mt-4 flex w-fit gap-1 rounded-full p-1">
          {ALG_SETS.map((entry) => (
            <Link
              key={entry.id}
              to={`/algs/${entry.id}`}
              data-alg-set={entry.id}
              className={`rounded-full px-5 py-2 text-sm tracking-tight transition-colors ${
                set === entry.id
                  ? 'bg-text/12 text-text'
                  : 'text-text-muted hover:text-text-dim'
              }`}
            >
              {entry.label}
            </Link>
          ))}
        </nav>
        {set === 'oll' && (
          <nav
            data-oll-groups
            className="glass-dock mx-auto mt-3 w-fit max-w-[min(32rem,calc(100%-0.5rem))] rounded-full p-1"
          >
            <div className="flex gap-0.5 overflow-x-auto px-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                data-oll-group="all"
                onClick={() => setOllGroup(null)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs tracking-tight ${
                  ollGroup === null
                    ? 'bg-text/12 text-text'
                    : 'text-text-muted hover:text-text-dim'
                }`}
              >
                All
              </button>
              {OLL_GROUPS.map((group) => (
                <button
                  key={group}
                  type="button"
                  data-oll-group={group}
                  onClick={() => setOllGroup(group)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs tracking-tight ${
                    ollGroup === group
                      ? 'bg-text/12 text-text'
                      : 'text-text-muted hover:text-text-dim'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-5 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))]"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-3 lg:grid-cols-2">
          {cases.map((entry) => (
            <CaseCard key={entry.id} entry={entry} set={set} />
          ))}
        </div>
      </main>
      <AppDock />
    </div>
  )
}
