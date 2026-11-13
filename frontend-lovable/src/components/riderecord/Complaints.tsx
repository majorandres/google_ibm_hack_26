import { useEffect, useState } from 'react'
import { api, outcomeLabel, type Channel, type Complaint, type Provider, type Trip } from '@/components/riderecord/api'
import { button, buttonSecondary, Deadline, input, Status, StatusChip } from '@/components/riderecord/ui'

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`

/**
 * How much of the office's filing window is used: the words, the bar and the status chip.
 * The backend counts the days; this only draws them. No known deadline draws an empty bar and says so.
 */
function FilingWindow({ daysLeft, deadlineDays }: { daysLeft: number | null; deadlineDays?: number | null | undefined }) {
  let text = 'No filing deadline on record'
  let label = 'No filing deadline on record for this office'
  let pct = 0
  let closed = false
  if (daysLeft !== null && deadlineDays) {
    closed = daysLeft < 0
    const used = Math.min(deadlineDays - daysLeft, deadlineDays)
    text = closed ? `Filing window closed ${days(-daysLeft)} ago` : `${days(daysLeft)} left to file`
    label = `${used} of ${days(deadlineDays)} in the filing window used`
    // The bar turns to its overdue colour at 100, so the last open day stops just short of it.
    pct = closed ? 100 : Math.min((used / deadlineDays) * 100, 99)
  }
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span data-mono className="text-[0.9375rem]">
          {text}
        </span>
        <StatusChip status={closed ? 'overdue' : 'pending'} label={closed ? 'Window closed' : 'To file'} />
      </div>
      <Deadline pct={pct} label={label} />
    </div>
  )
}

function ChannelDetails({ channel }: { channel: Channel }) {
  if (!channel.verified) {
    return (
      <p>
        We have not confirmed contact details for this office yet. For a Medicaid ride, call the member services number on your plan
        ID card. For SMART, contact SMART customer service.
      </p>
    )
  }
  const rows: [string, string | undefined][] = [
    ['Phone', channel.phone],
    ['TTY', channel.tty],
    ['Email', channel.email],
    ['Mail', channel.mail],
    ['Online form', channel.online_form],
    ['Form', channel.form],
  ]
  return (
    // On a phone each label sits tight on its own value, with space between the pairs; from sm up it is two columns.
    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[auto_1fr] sm:gap-y-1">
      {rows.map(([label, value]) => {
        if (!value) return null
        // A phone number or an email is one tap away from being used.
        const href = value.startsWith('http') ? value : label === 'Phone' ? `tel:${value}` : label === 'Email' ? `mailto:${value}` : null
        return (
          <div key={label} className="sm:contents">
            <dt className="font-semibold">{label}</dt>
            <dd className="break-words">{href ? <a href={href} className="text-lake underline underline-offset-2">{value}</a> : value}</dd>
          </div>
        )
      })}
    </dl>
  )
}

export default function Complaints({ providers }: { providers: Provider[] }) {
  // null until the first load settles, so "no rides" is never shown while still loading or after a failure.
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [letter, setLetter] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: '' })

  useEffect(() => {
    api
      .trips()
      .then((all) => setTrips(all.filter((t) => t.incident_type)))
      .catch((e: Error) => setStatus({ text: `Could not load your rides. ${e.message}`, error: true }))
  }, [])

  // The Copy button says "Copied" for a moment: the confirmation sits where the tap happened.
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter)
      setCopied(true)
      setStatus({ text: 'Copied. Nothing has been sent.' })
    } catch {
      setStatus({ text: 'Could not copy. Select the draft text and copy it yourself.', error: true })
    }
  }

  const providerName = (id: string) => providers.find((p) => p.id === id)?.name ?? id
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  async function draft() {
    setBusy(true)
    setComplaint(null)
    setStatus({ text: 'Writing your draft…' })
    try {
      const result = await api.complaint(selected)
      setComplaint(result)
      setLetter(result.draft)
      setStatus({ text: 'Your draft is ready below. Nothing has been sent.' })
    } catch (e) {
      setStatus({ text: (e as Error).message, error: true })
    } finally {
      setBusy(false)
    }
  }

  function download() {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([letter], { type: 'text/plain' }))
    link.download = 'riderecord-complaint-draft.txt'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xl font-semibold">Pick the rides to include (one ride service per complaint)</legend>
        {trips === null && !status.error && <p>Loading your rides…</p>}
        {trips?.length === 0 && <p>No problem rides logged yet. Rides you log as late, missed or denied show up here.</p>}
        <ul className="grid gap-3">
          {trips?.map((t) => (
            <li key={t.id} className="record">
              {/* The whole head is the checkbox's label, so the tap target is the full width of the record.
                  It tints on press, before the checkbox changes, so a tap is answered straight away. */}
              <label className="record-head cursor-pointer items-center justify-start rounded-t-record transition-colors duration-150 active:bg-tint has-checked:bg-tint">
                <input
                  type="checkbox"
                  name="trip"
                  checked={selected.includes(t.id)}
                  onChange={() => toggle(t.id)}
                  aria-describedby={`filing-${t.id}`}
                  className="size-5 flex-none accent-lake"
                />
                {/* The reference sits under the ride at every width, lined up with the text rather than the box. */}
                <span>
                  <span className="block font-semibold leading-snug">
                    <time dateTime={t.trip_date}>{t.trip_date}</time> · {providerName(t.provider_id)} ·{' '}
                    {t.direction === 'return' ? 'coming back' : 'going there'} · {outcomeLabel(t.incident_type)}
                    {t.minutes_late ? ` (${t.minutes_late} min)` : ''}
                  </span>
                  <span className="record-id mt-1 block">RIDE {t.id.slice(0, 8).toUpperCase()}</span>
                </span>
              </label>
              <div id={`filing-${t.id}`} className="record-body space-y-3">
                <p>
                  {t.filing ? (
                    <>
                      Goes to <span className="font-semibold">{t.filing.office}</span>
                    </>
                  ) : (
                    'No complaint office on record for this ride service'
                  )}
                </p>
                <FilingWindow daysLeft={t.filing?.days_left ?? null} deadlineDays={t.filing?.deadline_days} />
              </div>
            </li>
          ))}
        </ul>
      </fieldset>

      <button type="button" onClick={draft} disabled={busy || selected.length === 0} className={`${button} btn-block`}>
        {busy ? 'Writing…' : 'Draft my complaint'}
      </button>
      <Status error={status.error}>{status.text}</Status>

      {complaint && (
        // Arrives with a short fade and rise so it does not pop in after the wait. Reduced motion stills it (index.css).
        <section
          aria-labelledby="draft-heading"
          className="record transition-[opacity,translate] duration-250 ease-[cubic-bezier(0.23,1,0.32,1)] starting:translate-y-2 starting:opacity-0"
        >
          <header className="record-head flex-wrap">
            <h2 id="draft-heading">Send it to: {complaint.channel.name}</h2>
            <span className="record-id">DRAFT · NOT SENT</span>
          </header>
          <div className="record-body space-y-4">
            <div>
              <FilingWindow daysLeft={complaint.days_left} deadlineDays={complaint.channel.deadline_days} />
              {complaint.days_left !== null && (
                <p className="hint">
                  Counted from the oldest ride you picked. {complaint.channel.deadline_note}
                </p>
              )}
            </div>
            <ChannelDetails channel={complaint.channel} />

            <p className="font-semibold text-rust">{complaint.disclaimer}</p>
            <div>
              <label htmlFor="draft-letter" className="label">
                Your draft (you can edit it)
              </label>
              <textarea id="draft-letter" rows={14} value={letter} onChange={(e) => setLetter(e.target.value)} className={input} />
              <p className="hint">
                {complaint.drafted_by === 'granite'
                  ? `Drafted by IBM Granite (${complaint.model}) from the rides you picked. AI can make mistakes, so check every date and detail.`
                  : 'Written from a fixed template using the rides you picked (the AI drafter was not available).'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className={buttonSecondary} onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className={buttonSecondary} onClick={download}>
                Download
              </button>
              {complaint.channel.verified && complaint.channel.email && (
                <a className={buttonSecondary} href={`mailto:${complaint.channel.email}?subject=${encodeURIComponent('Paratransit service complaint')}&body=${encodeURIComponent(letter)}`}>
                  Open in my email
                </a>
              )}
            </div>
            <p>RideRecord never sends anything for you. You review it and you send it.</p>

            {complaint.escalation && (
              <p>
                <span className="font-semibold">If you get no answer:</span> {complaint.escalation.name}
                {complaint.escalation.phone && (
                  <>
                    ,{' '}
                    <a href={`tel:${complaint.escalation.phone}`} className="whitespace-nowrap text-lake underline underline-offset-2">
                      {complaint.escalation.phone}
                    </a>
                  </>
                )}
                . {complaint.escalation.notes}.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
