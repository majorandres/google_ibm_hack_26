import { useRef, useState } from 'react'
import { api, type Extracted, type Provider } from './api'
import TripForm from './TripForm'
import { button, input, Status } from './ui'

/** Talk (or type) -> Watson Speech to Text -> Granite extraction -> the rider confirms -> save. */
export default function VoiceLog({ providers }: { providers: Provider[] }) {
  const recorder = useRef<MediaRecorder | null>(null)
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<Extracted | null>(null)
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: '' })

  async function understand(request: Promise<Extracted>) {
    setBusy(true)
    setResult(null)
    setStatus({ text: 'Listening to what you said…' })
    try {
      const extracted = await request
      setResult(extracted)
      const summary = extracted.incident
        ? `I heard: ${extracted.incident.summary} Check the details below, then save.`
        : 'I could not pick out the details. Please fill in the form below.'
      setStatus({ text: summary })
      // Read-back for blind and low-vision riders. shortcut: browser voice; swap for Watson Text to Speech (plan P1).
      window.speechSynthesis?.speak(new SpeechSynthesisUtterance(summary))
    } catch (e) {
      setStatus({ text: (e as Error).message, error: true })
    } finally {
      setBusy(false)
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const chunks: Blob[] = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => chunks.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
        void understand(api.voice(new Blob(chunks, { type: mr.mimeType })))
      }
      mr.start()
      recorder.current = mr
      setRecording(true)
      setStatus({ text: 'Recording. Tap again when you are done.' })
    } catch {
      setStatus({ text: 'The microphone is not available. You can type what happened instead.', error: true })
    }
  }

  const incident = result?.incident
  return (
    <div className="space-y-6">
      <p className="text-lg">
        Say what happened in your own words. For example: “My return ride never came and I waited two hours.”
      </p>

      <button type="button" onClick={toggleRecording} disabled={busy} aria-pressed={recording} className={`${button} w-full py-6 text-2xl ${recording ? 'bg-red-800 hover:bg-red-900' : ''}`}>
        {recording ? 'Stop recording' : 'Tap to talk'}
      </button>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (typed.trim()) void understand(api.extract(typed.trim()))
        }}
      >
        <label className="block text-xl font-semibold">
          Or type what happened
          <textarea rows={2} maxLength={2000} value={typed} onChange={(e) => setTyped(e.target.value)} className={`${input} mt-2 font-normal`} />
        </label>
        <button type="submit" disabled={busy || !typed.trim()} className={button}>
          Use this
        </button>
      </form>

      <label className="block text-lg font-semibold">
        Or upload a recording
        <input
          type="file"
          accept="audio/*"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && void understand(api.voice(e.target.files[0]))}
          className={`${input} mt-2 font-normal`}
        />
      </label>

      <Status error={status.error}>{status.text}</Status>

      {result && (
        <section aria-labelledby="confirm-heading" className="space-y-4 rounded-lg border-2 border-slate-500 p-4">
          <h2 id="confirm-heading" className="text-2xl font-semibold">
            Check and save
          </h2>
          <p className="text-lg">
            <span className="font-semibold">You said:</span> “{result.transcript}”
          </p>
          <TripForm
            key={result.transcript}
            providers={providers}
            loggedVia="voice"
            initial={{
              ...(incident?.provider_id && { provider_id: incident.provider_id }),
              direction: incident?.direction ?? '',
              incident_type: incident?.incident_types[0] ?? '',
              minutes_late: incident?.minutes_late?.toString() ?? '',
              notes: result.transcript,
            }}
          />
        </section>
      )}
    </div>
  )
}
