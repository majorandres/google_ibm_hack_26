import { flushSync } from 'react-dom'

/**
 * Run a state update as an animated screen change where the browser supports it.
 * Resolves once the DOM has changed. It waits on updateCallbackDone, not ready or
 * finished, because those reject when a newer transition interrupts this one.
 */
export function withTransition(update: () => void): Promise<void> {
  if (!document.startViewTransition) {
    flushSync(update)
    return Promise.resolve()
  }
  return document.startViewTransition(() => flushSync(update)).updateCallbackDone
}
