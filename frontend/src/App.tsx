import { useEffect, useRef, useState } from 'react'
import { api, type Provider } from './api'
import Complaints from './Complaints'
import Dashboard from './Dashboard'
import TripForm from './TripForm'
import { Status } from './ui'
import VoiceLog from './VoiceLog'

const SCREENS = [
  { id: 'log', label: 'Log a ride' },
  { id: 'talk', label: 'Talk' },
  { id: 'complain', label: 'Complaints' },
  { id: 'data', label: 'Dashboard' },
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
    <div className="mx-auto max-w-2xl bg-white p-4 font-sans text-slate-950">
      <header>
        <p className="text-3xl font-bold text-blue-900">RideRecord</p>
        <p className="text-lg">Your own record of every paratransit and Medicaid ride. Demo account: Denise.</p>
      </header>

      <nav aria-label="Main" className="my-4">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCREENS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setScreen(s.id)
                  // Move focus to the new screen's heading so screen readers announce the change.
                  requestAnimationFrame(() => heading.current?.focus())
                }}
                aria-current={screen === s.id ? 'page' : undefined}
                className="min-h-11 w-full rounded-lg border-2 border-blue-800 px-2 py-2 text-lg font-semibold text-blue-900
                  focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-700
                  aria-[current=page]:bg-blue-800 aria-[current=page]:text-white"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        <h1 ref={heading} tabIndex={-1} className="mb-4 text-3xl font-semibold focus:outline-none">
          {title}
        </h1>
        {error && <Status error>Could not reach RideRecord: {error}</Status>}
        {screen === 'log' && <TripForm providers={providers} />}
        {screen === 'talk' && <VoiceLog providers={providers} />}
        {screen === 'complain' && <Complaints providers={providers} />}
        {screen === 'data' && <Dashboard />}
      </main>
    </div>
  )
}
