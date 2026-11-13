import type { ReactNode } from 'react'

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
      <span style={{ ['--pct' as string]: `${clamped}%` }} />
    </div>
  )
}
