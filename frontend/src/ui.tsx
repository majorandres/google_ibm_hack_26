import type { ReactNode } from 'react'

// Shared styles. Every control is at least 44px tall with a visible focus ring.
export const button =
  'min-h-11 rounded-lg bg-blue-800 px-5 py-2 text-lg font-semibold text-white hover:bg-blue-900 ' +
  'focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:bg-slate-500'
export const input =
  'min-h-11 w-full rounded-lg border-2 border-slate-500 bg-white px-3 py-2 text-lg ' +
  'focus-visible:outline-4 focus-visible:outline-amber-500'

/** A radio or checkbox drawn as a big button. The real input stays in the page for screen readers and keyboards. */
export function Choice(props: {
  type: 'radio' | 'checkbox'
  name: string
  checked: boolean
  onChange: () => void
  children: ReactNode
}) {
  return (
    <label
      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 border-slate-500 bg-white px-4 py-2 text-lg
        has-checked:border-blue-800 has-checked:bg-blue-100 has-checked:font-semibold
        has-focus-visible:outline-4 has-focus-visible:outline-amber-500"
    >
      <input
        type={props.type}
        name={props.name}
        checked={props.checked}
        onChange={props.onChange}
        className="size-5 accent-blue-800"
      />
      <span>{props.children}</span>
    </label>
  )
}

/** Announced by screen readers when its text changes. */
export function Status({ error, children }: { error?: boolean; children: ReactNode }) {
  return (
    <p role={error ? 'alert' : 'status'} className={`min-h-7 text-lg font-medium ${error ? 'text-red-800' : 'text-green-900'}`}>
      {children}
    </p>
  )
}
