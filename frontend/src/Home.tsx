import { useEffect, useState } from 'react'
import { api, outcomeLabel, type Provider, type Trip } from './api'
import { Status, StatusChip } from './ui'
import { ArrowRight, ChartNoAxesCombined, FileText, Mic, Plus } from 'lucide-react'

const FEATURES = [
  { id: 'log', icon: Plus, title: 'Log a ride', blurb: 'A few taps' },
  { id: 'talk', icon: Mic, title: 'Talk instead', blurb: 'Say what happened' },
  { id: 'complain', icon: FileText, title: 'Complaints', blurb: 'Draft a letter' },
  { id: 'data', icon: ChartNoAxesCombined, title: 'Patterns', blurb: 'See the trends' },
] as const

/**
 * Home: the screen the app opens on. A greeting, the two ways to log a ride,
 * and the rider's recent trips with their filing status. All data is real —
 * it comes from the RideRecord server, never mocked here.
 */
export default function Home({
  providers,
  onNavigate,
}: {
  providers: Provider[]
  onNavigate: (screen: (typeof FEATURES)[number]['id']) => void
}) {
  // null until the first load settles, so "no rides" never flashes while loading or after a failure.
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .trips()
      .then((all) => setTrips(all.slice(0, 3)))
      .catch((e: Error) => setError(e.message))
  }, [])

  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? id

  return (
    <div className="space-y-6">
      <p className="text-xl leading-snug text-ink/80">
        How was today&rsquo;s ride? Log it while it&rsquo;s fresh — ten seconds is enough.
      </p>

      <div className="split">
      <div className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onNavigate(f.id)}
            className="feature fx-rise"
            data-primary={i === 0 || undefined}
            style={{ ['--i' as string]: i }}
          >
            <f.icon aria-hidden="true" />
            <span className="feature-title">{f.title}</span>
            <span className="feature-blurb">{f.blurb}</span>
            <ArrowRight className="feature-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-xl font-semibold">
          Your recent rides
        </h2>
        {error && <Status error>Could not load your rides. {error}</Status>}
        {trips === null && !error && <p className="mt-3">Loading your rides…</p>}
        {trips?.length === 0 && (
          <p className="mt-3">No rides logged yet. Your last few rides will show up here.</p>
        )}
        <ul className="mt-3 grid gap-3">
          {trips?.map((t, i) => (
            <li key={t.id} className="record fx-rise" style={{ ['--i' as string]: i }}>
              <div className="record-head items-center justify-between">
                <span className="font-semibold leading-snug">
                  <time dateTime={t.trip_date}>{t.trip_date}</time> · {providerName(t.provider_id)} ·{' '}
                  {t.direction === 'return' ? 'coming back' : 'going there'}
                </span>
                {t.incident_type ? (
                  <StatusChip status="pending" label={outcomeLabel(t.incident_type)} />
                ) : (
                  <StatusChip status="resolved" label="On time" />
                )}
              </div>
              {t.filing && t.filing.days_left !== null && (
                <div className="record-body">
                  <p>
                    Goes to <span className="font-semibold">{t.filing.office}</span> —{' '}
                    {t.filing.days_left < 0
                      ? 'filing window closed'
                      : `${t.filing.days_left} ${t.filing.days_left === 1 ? 'day' : 'days'} left to file`}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      </div>
    </div>
  )
}
