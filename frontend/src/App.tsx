import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChartNoAxesCombined, ClipboardCheck, Home as HomeIcon, Mic, Plus, FileText, UserRound } from 'lucide-react'
import { api, type Provider } from './api'
import Complaints from './Complaints'
import Dashboard from './Dashboard'
import Home from './Home'
import TripForm from './TripForm'
import { Status } from './ui'
import VoiceLog from './VoiceLog'

const SCREENS = [
  { id: 'home', label: 'Hi, Denise', tab: 'Home', icon: HomeIcon },
  { id: 'log', label: 'Log a ride', tab: 'Log', icon: Plus },
  { id: 'talk', label: 'Talk', tab: 'Talk', icon: Mic },
  { id: 'complain', label: 'Complaints', tab: 'Complaints', icon: FileText },
  { id: 'data', label: 'Patterns', tab: 'Patterns', icon: ChartNoAxesCombined },
] as const
type ScreenId = (typeof SCREENS)[number]['id']

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('home')
  const [providers, setProviders] = useState<Provider[]>([])
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    api.providers().then(setProviders).catch((e: Error) => setError(e.message))
  }, [])

  const title = SCREENS.find((s) => s.id === screen)?.label ?? 'RideRecord'

  const navigation = (
    <nav aria-label="Main" className="rr-navigation">
      {SCREENS.map((s) => (
        <button key={s.id} type="button"
          onClick={() => {
            setScreen(s.id)
            requestAnimationFrame(() => heading.current?.focus())
          }}
          aria-current={screen === s.id ? 'page' : undefined}
          className="rr-tab"
        >
          <s.icon aria-hidden="true" />{s.tab}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="rr-app min-h-dvh bg-app-background text-app-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
      >
        Skip to content
      </a>

      <header className="border-b border-app-line bg-app-surface">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <a href="#" className="flex items-center gap-2.5 font-display text-xl font-bold text-app-ink">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-app-surface"><ClipboardCheck className="size-5" aria-hidden="true" /></span>
            RideRecord
          </a>
          <div className="hidden md:block">{navigation}</div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-highlight text-app-ink" aria-label="Denise's demo account" title="Denise · Demo account"><UserRound className="size-5" aria-hidden="true" /></span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-8 md:px-8 md:pt-12">
        <main id="main">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-app-muted"><span className="h-1 w-6 bg-brand-highlight" aria-hidden="true" />Michigan paratransit &amp; Medicaid rides</p>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 ref={heading} tabIndex={-1} className="focus:outline-none">
            {title}
          </h1>
          <span className="text-sm text-app-muted">Demo account · Denise</span>
          </div>
          <div className="space-y-6">
            {error && <Status error>Could not reach RideRecord: {error}</Status>}
            {screen === 'home' && <Home providers={providers} onNavigate={setScreen} />}
            {screen === 'log' && <TripForm providers={providers} />}
            {screen === 'talk' && <VoiceLog providers={providers} />}
            {screen === 'complain' && <Complaints providers={providers} />}
            {screen === 'data' && <Dashboard />}
          </div>
        </main>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-app-line pt-5">
          <p className="built-with">Built with IBM Bob · watsonx Orchestrate · Granite</p>
          <a href="#" className="flex items-center gap-1 text-sm font-semibold text-brand">About RideRecord <ArrowUpRight className="size-4" aria-hidden="true" /></a>
        </footer>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-app-line bg-app-surface pb-[env(safe-area-inset-bottom)] md:hidden">{navigation}</div>
    </div>
  )
}
