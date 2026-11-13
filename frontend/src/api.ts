// Demo account: there is no sign-in in the hackathon build. Never log real riders here.
export const RIDER_ID = 'demo-denise'

export type Provider = { id: string; name: string; type: string; region: string }
export type Direction = 'outbound' | 'return'

export type Trip = {
  id: string
  rider_id: string
  provider_id: string
  direction: Direction
  incident_type: string | null
  minutes_late: number | null
  notes: string | null
  trip_date: string
  logged_via: string
}
export type NewTrip = Omit<Trip, 'id'>

export type Extracted = {
  transcript: string
  incident: {
    provider_id: string | null
    direction: Direction | null
    incident_types: string[]
    minutes_late: number | null
    summary: string
  } | null
}

export type Channel = {
  name: string
  verified: boolean
  phone?: string
  tty?: string
  email?: string
  mail?: string
  online_form?: string
  form?: string
  notes?: string
  deadline_note?: string
}
export type Complaint = {
  channel: Channel
  escalation: Channel | null
  days_left: number | null
  draft: string
  drafted_by: 'granite' | 'template'
  model: string | null
  disclaimer: string
}

export type StatRow = { trips: number; problems: number; rate: number }
export type Stats = {
  threshold: number
  min_trips: number
  late_minutes: number
  source: string
  by_provider_month: (StatRow & { provider_name: string; month: string; flagged: boolean })[]
  by_direction: (StatRow & { direction: Direction })[]
}

// One entry per outcome button. value '' means the ride was fine.
export const OUTCOMES = [
  { value: '', label: 'On time' },
  { value: 'late_pickup', label: 'Late' },
  { value: 'no_show', label: 'Never came' },
  { value: 'wrong_vehicle', label: 'Wrong vehicle' },
  { value: 'trip_denied', label: 'Denied' },
  { value: 'excessive_length', label: 'Ride too long' },
  { value: 'long_hold', label: 'Long hold' },
  { value: 'driver_conduct', label: 'Driver or safety' },
]
export const outcomeLabel = (value: string | null) =>
  OUTCOMES.find((o) => o.value === (value ?? ''))?.label ?? 'Other problem'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Something went wrong (${response.status}).`)
  }
  return response.json()
}

const post = <T,>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const api = {
  providers: () => call<Provider[]>('/providers'),
  trips: () => call<Trip[]>(`/trips?rider_id=${RIDER_ID}`),
  logTrip: (trip: NewTrip) => post<Trip>('/trips', trip),
  extract: (transcript: string) => post<Extracted>('/extract', { transcript }),
  voice: (audio: Blob) =>
    call<Extracted>('/voice', { method: 'POST', headers: { 'Content-Type': audio.type || 'audio/webm' }, body: audio }),
  complaint: (trip_ids: string[]) => post<Complaint>('/complaints', { rider_id: RIDER_ID, trip_ids }),
  stats: () => call<Stats>('/stats'),
}
