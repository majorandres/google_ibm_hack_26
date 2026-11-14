import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Check, ClipboardCheck, type LucideIcon } from 'lucide-react'
import { reducedMotion } from './motion'

// Shared styles. Controls are 52-56px tall with a visible focus ring.
// Classes come from the design system in index.css.
export const button = 'btn btn-primary'
export const buttonSecondary = 'btn btn-secondary'
export const input = 'field'

/** A radio or checkbox drawn as a big target. The real input stays for screen readers and keyboards. */
export function Choice(props: {
  type: 'radio' | 'checkbox'
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}) {
  return (
    <label className="choice">
      <input
        type={props.type}
        name={props.name}
        checked={props.checked}
        onChange={props.onChange}
        className="size-5 flex-none accent-lake"
      />
      <span>{props.children}</span>
    </label>
  )
}

/** The RideRecord mark. One definition, so the welcome page and the app cannot drift apart. */
export function Logo() {
  return (
    <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-brand text-app-surface">
      <ClipboardCheck className="size-5" aria-hidden="true" />
    </span>
  )
}

/**
 * Decorative halftone field behind a whole page. The pattern itself stays put; the only
 * movement is a swell that follows the pointer or finger. Reduced motion leaves it fully still.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const GAP = 14
    const REACH = 2 * 150 ** 2 // how far the pointer's pull spreads
    let raf = 0
    // Pointer target, and the point that eases toward it so the swell trails like liquid.
    const target = { x: -9999, y: -9999 }
    const at = { ...target }
    let goal = 0 // 1 while a pointer is over the page, 0 once it has left
    let power = 0 // eases toward goal, so the swell grows in and dissipates
    const draw = () => {
      raf = 0
      const dpr = window.devicePixelRatio
      at.x += (target.x - at.x) * 0.08
      at.y += (target.y - at.y) * 0.08
      power += (goal - power) * 0.06
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#d4d4d4' // light enough that muted text over a dot still passes 4.5:1
      for (let y = GAP / 2; y < window.innerHeight; y += GAP) {
        for (let x = GAP / 2; x < window.innerWidth; x += GAP) {
          const pull = 1.6 * power * Math.exp(-((x - at.x) ** 2 + (y - at.y) ** 2) / REACH)
          const v = Math.min(Math.sin(x * 0.006) + Math.cos(y * 0.008) - 0.6 + pull, 1.6)
          if (v > 0) ctx.fillRect((x - v * 1.75) * dpr, (y - v * 1.75) * dpr, v * 3.5 * dpr, v * 3.5 * dpr)
        }
      }
      // Keep drawing only while the swell is still catching up with the pointer or fading.
      if (Math.abs(target.x - at.x) + Math.abs(target.y - at.y) > 0.5 || Math.abs(goal - power) > 0.01) raf = requestAnimationFrame(draw)
    }
    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      draw()
    }
    const move = (e: PointerEvent) => {
      target.x = e.clientX
      target.y = e.clientY
      goal = 1
      if (!raf) raf = requestAnimationFrame(draw)
    }
    // Fires when the mouse leaves the window and when a finger lifts.
    const leave = () => {
      goal = 0
      if (!raf) raf = requestAnimationFrame(draw)
    }
    resize()
    window.addEventListener('resize', resize)
    if (!reducedMotion()) {
      window.addEventListener('pointermove', move, { passive: true })
      document.documentElement.addEventListener('pointerleave', leave)
    }
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas ref={ref} className="dots" aria-hidden="true" />
}

/** One module of a screen: an icon, a short title and one job. `done` swaps the icon for a tick. */
export function Card(props: {
  icon: LucideIcon
  title: string
  done?: boolean
  role?: 'group' | 'radiogroup'
  className?: string
  children: ReactNode
}) {
  const id = useId()
  const Mark = props.done ? Check : props.icon
  return (
    <section role={props.role} aria-labelledby={id} className={`card ${props.className ?? ''}`}>
      <div className="card-head">
        <span className="card-icon" data-done={props.done || undefined} aria-hidden="true">
          <Mark />
        </span>
        <h2 id={id}>
          {props.title}
          {props.done && <span className="sr-only"> (answered)</span>}
        </h2>
      </div>
      {props.children}
    </section>
  )
}

/** Extra detail the rider opens when they want it. Native <details>, so keyboards and screen readers work as-is. */
export function More(props: { summary: string; open?: boolean; className?: string; children: ReactNode }) {
  const { summary, children } = props
  return (
    <details className={`more ${props.className ?? ''}`} open={props.open}>
      <summary>{summary}</summary>
      <div>{children}</div>
    </details>
  )
}

/** Announced by screen readers when its text changes. */
export function Status({ error, children }: { error?: boolean | undefined; children: ReactNode }) {
  if (!children) return <p role={error ? 'alert' : 'status'} className="min-h-7" />
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`chip ${error ? 'chip-overdue' : 'chip-filed'} my-2 max-w-full whitespace-normal py-1.5 text-left normal-case tracking-normal`}
    >
      {children}
    </p>
  )
}

/** Status of a filed complaint: colour plus a distinct shape plus the word. Never colour alone. */
export function StatusChip({ status, label }: { status: string; label?: string }) {
  const kind =
    status === 'filed' || status === 'resolved'
      ? 'filed'
      : status === 'overdue'
        ? 'overdue'
        : 'pending'
  return <span className={`chip chip-${kind}`}>{label ?? status}</span>
}

/** A filed record: hairline rules, monospace reference, content below. */
export function Record({
  reference,
  title,
  children,
}: {
  reference?: string
  title: ReactNode
  children: ReactNode
}) {
  return (
    <article className="record mb-4">
      <header className="record-head">
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
        {reference && <span className="record-id">{reference}</span>}
      </header>
      <div className="record-body">{children}</div>
    </article>
  )
}

/**
 * Time remaining before the agency's response deadline, as a rule rather than a number.
 * `pct` is 0-100 of the window elapsed.
 */
export function Deadline({ pct, label }: { pct: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      role="img"
      aria-label={label}
      className="deadline mt-3"
      data-state={clamped >= 100 ? 'overdue' : undefined}
    >
      <span className="fx-grow" style={{ ['--pct' as string]: `${clamped}%` }} />
    </div>
  )
}
