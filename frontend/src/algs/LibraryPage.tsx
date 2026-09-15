import { Link, Navigate, useParams } from 'react-router-dom'
import { casesForSet, parseAlgSet } from './catalog'
import CaseCard from './CaseCard'
import { ALG_SETS } from './types'
import AppDock from '../nav/AppDock'

export default function LibraryPage() {
  const { set: setParam } = useParams()
  if (setParam !== undefined && setParam !== 'pll' && setParam !== 'oll') {
    return <Navigate to="/algs/pll" replace />
  }
  const set = parseAlgSet(setParam)
  const cases = casesForSet(set)

  return (
    <div data-algs-page className="flex h-full flex-col bg-bg font-sans text-text">
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
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-6 pb-[max(7rem,calc(env(safe-area-inset-bottom)+5.5rem))]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((entry) => (
            <CaseCard key={entry.id} entry={entry} set={set} />
          ))}
        </div>
      </main>
      <AppDock />
    </div>
  )
}
