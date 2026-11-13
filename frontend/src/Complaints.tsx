import { useEffect, useState } from 'react'
import { api, outcomeLabel, type Channel, type Complaint, type Provider, type Trip } from './api'
import { button, Choice, input, Status } from './ui'

function ChannelDetails({ channel }: { channel: Channel }) {
  if (!channel.verified) {
    return (
      <p className="text-lg">
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
    <dl className="grid gap-x-4 gap-y-1 text-lg sm:grid-cols-[auto_1fr]">
      {rows.map(([label, value]) =>
        value ? (
          <div key={label} className="contents">
            <dt className="font-semibold">{label}</dt>
            <dd className="break-words">{value.startsWith('http') ? <a href={value} className="text-blue-800 underline">{value}</a> : value}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}

export default function Complaints({ providers }: { providers: Provider[] }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [letter, setLetter] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: '' })

  useEffect(() => {
    api
      .trips()
      .then((all) => setTrips(all.filter((t) => t.incident_type)))
      .catch((e: Error) => setStatus({ text: e.message, error: true }))
  }, [])

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
        {trips.length === 0 && <p className="text-lg">No problem rides logged yet.</p>}
        <div className="grid gap-2">
          {trips.map((t) => (
            <Choice key={t.id} type="checkbox" name="trip" checked={selected.includes(t.id)} onChange={() => toggle(t.id)}>
              {t.trip_date} · {providerName(t.provider_id)} · {t.direction === 'return' ? 'coming back' : 'going there'} ·{' '}
              {outcomeLabel(t.incident_type)}
              {t.minutes_late ? ` (${t.minutes_late} min)` : ''}
            </Choice>
          ))}
        </div>
      </fieldset>

      <button type="button" onClick={draft} disabled={busy || selected.length === 0} className={`${button} w-full`}>
        {busy ? 'Writing…' : 'Draft my complaint'}
      </button>
      <Status error={status.error}>{status.text}</Status>

      {complaint && (
        <section aria-labelledby="draft-heading" className="space-y-4 rounded-lg border-2 border-slate-500 p-4">
          <h2 id="draft-heading" className="text-2xl font-semibold">
            Send it to: {complaint.channel.name}
          </h2>
          {complaint.days_left !== null && (
            <p className="text-xl font-semibold">
              {complaint.days_left >= 0
                ? `${complaint.days_left} days left to file.`
                : `The filing window closed ${-complaint.days_left} days ago for the oldest ride.`}{' '}
              <span className="font-normal">{complaint.channel.deadline_note}</span>
            </p>
          )}
          <ChannelDetails channel={complaint.channel} />

          <p className="rounded-lg bg-amber-100 p-3 text-lg font-semibold">{complaint.disclaimer}</p>
          <label className="block text-xl font-semibold">
            Your draft (you can edit it)
            <textarea rows={14} value={letter} onChange={(e) => setLetter(e.target.value)} className={`${input} mt-2 font-normal`} />
          </label>
          <p className="text-base text-slate-700">
            {complaint.drafted_by === 'granite'
              ? `Drafted by IBM Granite (${complaint.model}) from the rides you picked. AI can make mistakes, so check every date and detail.`
              : 'Written from a fixed template using the rides you picked (the AI drafter was not available).'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => navigator.clipboard.writeText(letter).then(() => setStatus({ text: 'Copied.' }))}>
              Copy
            </button>
            <button type="button" className={button} onClick={download}>
              Download
            </button>
            {complaint.channel.verified && complaint.channel.email && (
              <a className={`${button} inline-flex items-center`} href={`mailto:${complaint.channel.email}?subject=${encodeURIComponent('Paratransit service complaint')}&body=${encodeURIComponent(letter)}`}>
                Open in my email
              </a>
            )}
          </div>
          <p className="text-lg">RideRecord never sends anything for you. You review it and you send it.</p>

          {complaint.escalation && (
            <p className="text-lg">
              <span className="font-semibold">If you get no answer:</span> {complaint.escalation.name}
              {complaint.escalation.phone ? `, ${complaint.escalation.phone}` : ''}. {complaint.escalation.notes}.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
