import { useEffect, useRef, useState } from 'react'
import { api, type Provider } from './api'
import Complaints from './Complaints'
import Dashboard from './Dashboard'
import TripForm from './TripForm'
import { Status } from './ui'
import VoiceLog from './VoiceLog'

const SCREENS = [
  { id: 'log', label: 'Log a ride', tab: 'Log' },
  { id: 'talk', label: 'Talk', tab: 'Talk' },
  { id: 'complain', label: 'Complaints', tab: 'Complaints' },
  { id: 'data', label: 'Dashboard', tab: 'Patterns' },
] as const
type ScreenId = (typeof SCREENS)[number]['id']

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('log')
  const [providers, setProviders] = useState<Provider[]>([])
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    api.providers().then(setProviders).catch((e: Error) => setError(e.message))
  }, [])

  const title = SCREENS.find((s) => s.id === screen)!.label

  return (
    <div className="min-h-dvh bg-limestone">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ink focus:px-4 focus:py-3 focus:text-paper"
      >
        Skip to content
      </a>

      <div className="mx-auto w-full max-w-2xl px-5 pb-28 pt-6">
        <header className="border-b border-line pb-5">
          <p className="eyebrow">Michigan paratransit &amp; Medicaid rides</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Ride<span className="text-lake">Record</span>
          </p>
          <p className="mt-2 max-w-prose text-[1.0625rem] leading-snug text-ink/80">
            Your own record of every ride. When a trip goes wrong, you leave with proof.
          </p>
          <p className="mt-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong px-3 py-1 text-sm font-semibold text-ink/75">
              Demo account <span aria-hidden="true">·</span> Denise
            </span>
          </p>
        </header>

        <main id="main" className="pt-6">
          <h1 ref={heading} tabIndex={-1} className="focus:outline-none">
            {title}
          </h1>
          <div className="mt-4">
            {error && <Status error>Could not reach RideRecord: {error}</Status>}
            {screen === 'log' && <TripForm providers={providers} />}
            {screen === 'talk' && <VoiceLog providers={providers} />}
            {screen === 'complain' && <Complaints providers={providers} />}
            {screen === 'data' && <Dashboard />}
          </div>
        </main>

        <footer className="mt-10 border-t border-line pt-4">
          <p className="built-with">Built with IBM Bob · watsonx Orchestrate · Granite</p>
        </footer>
      </div>

      {/* Thumb-reachable navigation. Labels are always visible, never icon-only. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper"
      >
        <ul className="tabbar mx-auto max-w-2xl">
          {SCREENS.map((s) => (
            <li key={s.id} className="contents">
              <button
                type="button"
                onClick={() => {
                  setScreen(s.id)
                  // Move focus to the new screen's heading so screen readers announce the change.
                  requestAnimationFrame(() => heading.current?.focus())
                }}
                aria-current={screen === s.id ? 'page' : undefined}
                className="tab"
              >
                {s.tab}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
