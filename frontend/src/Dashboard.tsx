import { useEffect, useState } from 'react'
import { api, type StatRow, type Stats } from './api'
import { ArrowLeftRight, TriangleAlert } from 'lucide-react'
import { Card, More, Status, StatusChip } from './ui'

const percent = (rate: number) => `${(rate * 100).toFixed(1)}%`
const cell = 'border-b border-app-line px-3 py-2 text-left'

/** The bar is decoration; the number beside it and the table carry the data. */
function Rate({ row, max }: { row: StatRow; max: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-14 tabular-nums">{percent(row.rate)}</span>
      <span aria-hidden="true" className="fx-grow h-3 rounded bg-brand" style={{ width: `${(row.rate / max) * 8}rem` }} />
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
    <div className="space-y-4">
      <p className="rounded-lg border border-pending bg-brand-highlight/20 p-3 font-semibold">
        Demo data, not real riders. These providers are made up.
      </p>

      <Card icon={TriangleAlert} title="Possible patterns" className="fx-rise">
        {flagged.length === 0 ? (
          <p>None this period.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {flagged.map((r) => (
              <li key={r.provider_name + r.month} className="rounded-lg border border-app-line p-4">
                <p className="eyebrow">{r.month}</p>
                <p className="font-semibold">{r.provider_name}</p>
                <p className="font-display text-4xl font-bold tabular-nums text-brand">{percent(r.rate)}</p>
                <p className="mb-2">
                  {r.problems} of {r.trips} trips late, missed or denied
                </p>
                <StatusChip status="pending" label="Worth investigating" />
              </li>
            ))}
          </ul>
        )}
        <p className="hint">A flag is not a finding of a violation.</p>
      </Card>

      <Card icon={ArrowLeftRight} title="Going there vs. coming back" className="fx-rise">
        <ul className="grid gap-3 sm:grid-cols-2">
          {stats.by_direction.map((r) => (
            <li key={r.direction} className="rounded-lg border border-app-line p-4">
              <p className="font-semibold">{r.direction === 'return' ? 'Coming back' : 'Going there'}</p>
              <Rate row={r} max={max} />
              <p className="hint">late, missed or denied, of {r.trips} trips</p>
            </li>
          ))}
        </ul>
      </Card>

      <More summary="How we decide what to flag">
        <p>
          At least {stats.min_trips} logged trips in a month, and {percent(stats.threshold)} or more of them more than{' '}
          {stats.late_minutes} minutes late, a no-show, or denied.
        </p>
        <p className="mt-2">
          Federal rule 49 CFR 37.131(f) bans patterns of “substantial numbers” of these but does not define “substantial”, so this
          threshold is our assumption for the demo.
        </p>
      </More>

      <More summary="Every provider and month">
        <div className="overflow-x-auto focus-visible:outline-4 focus-visible:outline-brand" tabIndex={0} role="region" aria-label="Every provider and month">
          <table className="w-full">
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
        <p className="hint">Source: synthetic trips, aggregated in {stats.source === 'bigquery' ? 'Google BigQuery' : 'a local CSV file'}.</p>
      </More>
    </div>
  )
}
