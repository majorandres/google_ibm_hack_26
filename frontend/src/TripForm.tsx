import { useState, type FormEvent } from 'react'
import { api, MAX_TEXT, OUTCOMES, RIDER_ID, type Direction, type Provider } from './api'
import { button, Choice, input, Status } from './ui'

export type TripDraft = {
  provider_id: string
  direction: Direction | ''
  incident_type: string
  minutes_late: string
  notes: string
  trip_date: string
}

const LAST_PROVIDER = 'riderecord.lastProvider'
const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

/** The quick log. Also used to confirm what voice logging understood. */
export default function TripForm(props: {
  providers: Provider[]
  initial?: Partial<TripDraft>
  loggedVia?: 'tap' | 'voice'
  onSaved?: () => void
}) {
  const blank: TripDraft = {
    // Remembering the last provider keeps a routine log to three taps: direction, outcome, save.
    provider_id: localStorage.getItem(LAST_PROVIDER) ?? '',
    direction: '',
    incident_type: '',
    minutes_late: '',
    notes: '',
    trip_date: today(),
  }
  const [draft, setDraft] = useState<TripDraft>({ ...blank, ...props.initial })
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: '' })
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<TripDraft>) => setDraft((d) => ({ ...d, ...patch }))

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft.provider_id || !draft.direction) {
      setStatus({ text: 'Pick a ride service and a direction first.', error: true })
      return
    }
    setSaving(true)
    try {
      await api.logTrip({
        rider_id: RIDER_ID,
        provider_id: draft.provider_id,
        direction: draft.direction,
        incident_type: draft.incident_type || null,
        minutes_late: draft.incident_type === 'late_pickup' && draft.minutes_late ? Number(draft.minutes_late) : null,
        notes: draft.notes.trim() || null,
        trip_date: draft.trip_date || today(),
        logged_via: props.loggedVia ?? 'tap',
      })
      localStorage.setItem(LAST_PROVIDER, draft.provider_id)
      setStatus({ text: 'Saved. Your ride is in your record.' })
      setDraft({ ...blank, provider_id: draft.provider_id })
      props.onSaved?.()
    } catch (e) {
      setStatus({ text: `Not saved. ${(e as Error).message}`, error: true })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-xl font-semibold">Which ride service?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {props.providers.map((p) => (
            <Choice key={p.id} type="radio" name="provider" checked={draft.provider_id === p.id} onChange={() => set({ provider_id: p.id })}>
              {p.name}
            </Choice>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xl font-semibold">Which trip?</legend>
        <div className="grid grid-cols-2 gap-2">
          <Choice type="radio" name="direction" checked={draft.direction === 'outbound'} onChange={() => set({ direction: 'outbound' })}>
            Going there
          </Choice>
          <Choice type="radio" name="direction" checked={draft.direction === 'return'} onChange={() => set({ direction: 'return' })}>
            Coming back
          </Choice>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xl font-semibold">How did it go?</legend>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map((o) => (
            <Choice key={o.value} type="radio" name="outcome" checked={draft.incident_type === o.value} onChange={() => set({ incident_type: o.value })}>
              {o.label}
            </Choice>
          ))}
        </div>
      </fieldset>

      {draft.incident_type === 'late_pickup' && (
        <label className="block text-xl font-semibold">
          How many minutes late? (optional)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={1440}
            value={draft.minutes_late}
            onChange={(e) => set({ minutes_late: e.target.value })}
            className={`${input} mt-2 font-normal`}
          />
        </label>
      )}

      <label className="block text-xl font-semibold">
        What day was the ride?
        <input
          type="date"
          max={today()}
          value={draft.trip_date}
          onChange={(e) => set({ trip_date: e.target.value })}
          className={`${input} mt-2 font-normal`}
        />
      </label>

      <label className="block text-xl font-semibold">
        Anything to add? (optional)
        <textarea
          rows={2}
          maxLength={MAX_TEXT}
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          className={`${input} mt-2 font-normal`}
        />
        <span className="mt-1 block text-base font-normal text-slate-700">
          Please leave out street addresses and medical details.
        </span>
      </label>

      <button type="submit" disabled={saving} className={`${button} w-full`}>
        {saving ? 'Saving…' : 'Save this ride'}
      </button>
      <Status error={status.error}>{status.text}</Status>
    </form>
  )
}
