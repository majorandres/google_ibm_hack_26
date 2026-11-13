import { useEffect, useState } from 'react'

type Health = { status: string; watsonx_configured: boolean; model: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message))
  }, [])

  return (
    <main className="mx-auto max-w-xl p-8 font-sans">
      <h1 className="text-3xl font-semibold">Commute Check</h1>
      <p className="mt-2 text-slate-600">
        Can you make the round trip to this job by bus, at the hours the shift demands?
      </p>
      <section className="mt-6 rounded-lg border border-slate-200 p-4 text-sm">
        <h2 className="font-medium">Backend</h2>
        {error && <p className="text-red-600">Not reachable: {error}</p>}
        {!error && !health && <p>Checking…</p>}
        {health && (
          <ul className="mt-1 space-y-1">
            <li>API: {health.status}</li>
            <li>
              Granite ({health.model}): {health.watsonx_configured ? 'configured' : 'not configured'}
            </li>
          </ul>
        )}
      </section>
    </main>
  )
}
