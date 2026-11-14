// Every component tilts toward the mouse: one delegated listener for the landing page and the app.

const TARGETS =
  '.lp-step, .lp-stat, .lp-faq details, .lp-cta, .lp-header-cta, .lp-band-cta, .lp-logo, .btn, .key, .choice, .record, .rr-tab'
const MAX_DEG = 7

export type TiltBox = { left: number; top: number; width: number; height: number }

/**
 * The rotation that tips the side under the pointer away from the viewer, as the axis (x, y)
 * and angle for the CSS `rotate` property. Null at the centre or outside the box.
 */
export function tiltFor(x: number, y: number, box: TiltBox, max: number) {
  const nx = ((x - box.left) / box.width) * 2 - 1
  const ny = ((y - box.top) / box.height) * 2 - 1
  if (Math.abs(nx) > 1 || Math.abs(ny) > 1) return null
  const reach = Math.min(1, Math.hypot(nx, ny))
  if (reach < 0.05) return null
  return { x: 0 - ny, y: nx, angle: reach * max }
}

/**
 * Mouse only, on devices that can hover, and never with reduced motion. Uses the `rotate`
 * property so it composes with the `transform` animations and `translate` presses in the CSS.
 */
export function startTilt() {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)')
  const still = window.matchMedia('(prefers-reduced-motion: reduce)')
  let current: HTMLElement | null = null
  let box: DOMRect | null = null
  let x = 0
  let y = 0
  let raf = 0

  const release = () => {
    current?.style.removeProperty('rotate')
    current = null
    box = null
  }
  const inside = (b: DOMRect) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom
  const draw = () => {
    raf = 0
    if (!current || !box) return
    const t = tiltFor(x, y, box, MAX_DEG)
    if (t) current.style.setProperty('rotate', `${t.x.toFixed(3)} ${t.y.toFixed(3)} 0 ${t.angle.toFixed(2)}deg`)
    else current.style.removeProperty('rotate')
  }

  document.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse' || !canHover.matches || still.matches) return release()
      x = event.clientX
      y = event.clientY
      const hit = event.target instanceof Element ? event.target.closest<HTMLElement>(TARGETS) : null
      // Keep the current element while the pointer is over its untilted box, so a dipping edge never flickers.
      const keep = current && box && inside(box) && (!hit || hit.contains(current) || current.contains(hit))
      if (hit !== current && !keep) {
        release()
        if (hit) {
          current = hit
          box = hit.getBoundingClientRect()
        }
      }
      if (!raf) raf = requestAnimationFrame(draw)
    },
    { passive: true },
  )
  document.documentElement.addEventListener('pointerleave', release)
  window.addEventListener('scroll', release, { passive: true })
  window.addEventListener('blur', release)
}
