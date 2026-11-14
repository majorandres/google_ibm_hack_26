/** A word's character range in its text node and its box on screen. */
export type Box = { start: number; end: number; top: number; bottom: number; left: number; right: number }

/**
 * Groups word boxes, in reading order, into the lines the browser laid out:
 * a word whose top is within half a line of the current run's top joins that run.
 */
export function groupLines(words: Box[]): Box[] {
  const runs: Box[] = []
  for (const word of words) {
    const run = runs.at(-1)
    if (run && Math.abs(word.top - run.top) < (run.bottom - run.top) / 2) {
      run.end = word.end
      run.right = Math.max(run.right, word.right)
      run.bottom = Math.max(run.bottom, word.bottom)
    } else {
      runs.push({ ...word })
    }
  }
  return runs
}
