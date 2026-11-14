import { flushSync } from 'react-dom'

/**
 * Run a state update as an animated screen change where the browser supports it.
 * Resolves once the DOM has changed. It waits on updateCallbackDone, not ready,
 * because ready rejects when a newer transition interrupts this one.
 */
export function withTransition(update: () => void): Promise<void> {
  if (!document.startViewTransition) {
    flushSync(update)
    return Promise.resolve()
  }
  const transition = document.startViewTransition(() => flushSync(update))
  transition.ready.catch(() => {}) // interrupted or hidden tab: the update still ran, only the animation was skipped
  return transition.updateCallbackDone
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
