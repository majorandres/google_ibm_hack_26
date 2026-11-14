/**
 * Scroll math for the landing page, shared by the three.js world and the CSS fallback
 * so both tell the same story. Pure functions, no DOM and no three.js.
 */

export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n))

export const smoothstep = (t: number) => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}

/** Progress through a pinned (sticky) track: 0 when it pins, 1 when it lets go. */
export function trackProgress(top: number, height: number, viewportH: number) {
  const scrollable = height - viewportH
  return scrollable > 0 ? clamp(-top / scrollable) : 0
}

/** 0 when an element's top meets the viewport bottom, 1 when its bottom leaves the top. */
export const viewProgress = (top: number, height: number, viewportH: number) =>
  clamp((viewportH - top) / (viewportH + height))

/**
 * The street story. Phases: 0 waiting (0–0.3), 1 the van approaches (0.3–0.6),
 * 2 it drives past (0.6–0.85), 3 missed (0.85–1). Angles in degrees.
 */
export function street(progress: number) {
  const p = clamp(progress)
  const rise = clamp(p / 0.15) // pop-up pieces stand
  const verdict = clamp((p - 0.85) / 0.15) // the missed day comes forward
  return {
    rise,
    vanIn: clamp((p - 0.3) / 0.3),
    vanPast: clamp((p - 0.6) / 0.25),
    verdict,
    missed: p >= 0.85,
    tilt: 24 - rise * 8 - verdict * 10, // looking down into the street, levelling out for the verdict
    orbit: -16 + p * 32, // swinging along the street with the van
    phase: p < 0.3 ? 0 : p < 0.6 ? 1 : p < 0.85 ? 2 : 3,
  }
}

/** Clock hands in degrees clockwise from 12: 9:00 at the start of the story, 9:20 at the end. */
export function clockAngles(progress: number) {
  const p = clamp(progress)
  return { minute: p * 120, hour: 270 + p * 10 }
}

/** The hero clock's flight to the street: 0 at the top of the page, 1 once the street pins. */
export const flight = (scrollY: number, trackTop: number) => (trackTop > 0 ? smoothstep(scrollY / trackTop) : 1)
