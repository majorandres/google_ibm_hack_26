import { useEffect, useState } from 'react'
import { api, type StatRow, type Stats } from '@/components/riderecord/api'
import { Status } from '@/components/riderecord/ui'

const percent = (rate: number) => `${(rate * 100).toFixed(1)}%`
const cell = 'border-b border-app-line px-3 py-2 text-left'

/** The bar is decoration; the number beside it and the table carry the data. */
function Rate({ row, max }: { row: StatRow; max: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-14 tabular-nums">{percent(row.rate)}</span>
      <span aria-hidden="true" className="h-3 rounded bg-brand" style={{ width: `${(row.rate / max) * 8}rem` }} />
    </span>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.stats().then(setStats).catch((e: Error) => setError(e.message))
  }, [])

  if (error) return <Status error>{error}</Status>
  if (!stats) return <Status>Loading…</Status>

  const max = Math.max(...stats.by_provider_month.map((r) => r.rate), 0.01)
  const flagged = stats.by_provider_month.filter((r) => r.flagged)
  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-pending bg-brand-highlight/20 p-3 text-lg font-semibold">
        Demo data, not real riders. These providers are made up. Nothing here describes a real agency.
      </p>

      <section aria-labelledby="flags-heading">
        <h2 id="flags-heading" className="text-2xl font-semibold">
          Possible patterns
        </h2>
        {flagged.length === 0 ? (
          <p className="text-lg">None this period.</p>
        ) : (
          <ul className="list-disc pl-6 text-lg">
            {flagged.map((r) => (
              <li key={r.provider_name + r.month}>
                <strong>
                  {r.provider_name}, {r.month}:
                </strong>{' '}
                {r.problems} of {r.trips} logged trips ({percent(r.rate)}) were late, missed or denied. Possible pattern, worth
                investigating.
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-base text-app-muted">
          How we flag: at least {stats.min_trips} logged trips in a month, and {percent(stats.threshold)} or more of them more than{' '}
          {stats.late_minutes} minutes late, a no-show, or denied. Federal rule 49 CFR 37.131(f) bans patterns of “substantial numbers”
          of these but does not define “substantial”, so this threshold is our assumption for the demo. A flag is not a finding of a
          violation.
        </p>
      </section>

      <section aria-labelledby="direction-heading">
        <h2 id="direction-heading" className="text-2xl font-semibold">
          Going there vs. coming back
        </h2>
        <table className="w-full text-lg">
          <thead>
            <tr>
              <th scope="col" className={cell}>Trip</th>
              <th scope="col" className={cell}>Logged trips</th>
              <th scope="col" className={cell}>Late, missed or denied</th>
            </tr>
          </thead>
          <tbody>
            {stats.by_direction.map((r) => (
              <tr key={r.direction}>
                <th scope="row" className={cell}>{r.direction === 'return' ? 'Coming back' : 'Going there'}</th>
                <td className={cell}>{r.trips}</td>
                <td className={cell}><Rate row={r} max={max} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="table-heading">
        <h2 id="table-heading" className="text-2xl font-semibold">
          By provider and month
        </h2>
        <div className="overflow-x-auto focus-visible:outline-4 focus-visible:outline-brand" tabIndex={0} role="region" aria-labelledby="table-heading">
          <table className="w-full text-lg">
            <thead>
              <tr>
                <th scope="col" className={cell}>Provider (fictional)</th>
                <th scope="col" className={cell}>Month</th>
                <th scope="col" className={cell}>Logged trips</th>
                <th scope="col" className={cell}>Late, missed or denied</th>
                <th scope="col" className={cell}>Flag</th>
              </tr>
            </thead>
            <tbody>
              {stats.by_provider_month.map((r) => (
                <tr key={r.provider_name + r.month} className={r.flagged ? 'bg-brand-highlight/20 font-semibold' : ''}>
                  <th scope="row" className={`${cell} font-normal`}>{r.provider_name}</th>
                  <td className={cell}>{r.month}</td>
                  <td className={cell}>{r.trips}</td>
                  <td className={cell}><Rate row={r} max={max} /></td>
                  <td className={cell}>{r.flagged ? 'Possible pattern' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-base text-app-muted">Source: synthetic trips, aggregated in {stats.source === 'bigquery' ? 'Google BigQuery' : 'a local CSV file'}.</p>
      </section>
    </div>
  )
}
