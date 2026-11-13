import { useEffect, useState } from 'react'
import { api, outcomeLabel, type Provider, type Trip } from '@/components/riderecord/api'
import { Status, StatusChip } from '@/components/riderecord/ui'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mic, Plus } from 'lucide-react'

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
  onNavigate: (screen: 'log' | 'talk') => void
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => onNavigate('log')} className="min-h-16 justify-between rounded-lg bg-brand px-5 text-base font-semibold text-app-surface shadow-none hover:bg-brand-hover">
          <span className="flex items-center gap-3"><Plus aria-hidden="true" />Log a ride</span><ArrowRight aria-hidden="true" />
        </Button>
        <Button variant="outline" type="button" onClick={() => onNavigate('talk')} className="min-h-16 justify-between rounded-lg border-app-line bg-app-surface px-5 text-base font-semibold text-brand shadow-none hover:bg-app-tint">
          <span className="flex items-center gap-3"><Mic aria-hidden="true" />Talk instead</span><ArrowRight aria-hidden="true" />
        </Button>
      </div>

      <section aria-labelledby="recent-heading" className="border-t border-app-line pt-7">
        <h2 id="recent-heading" className="text-xl font-semibold">
          Your recent rides
        </h2>
        {error && <Status error>Could not load your rides. {error}</Status>}
        {trips === null && !error && <p className="mt-3">Loading your rides…</p>}
        {trips?.length === 0 && (
          <p className="mt-3">No rides logged yet. Your last few rides will show up here.</p>
        )}
        <ul className="mt-3 grid gap-3">
          {trips?.map((t) => (
            <li key={t.id} className="record">
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
  )
}
