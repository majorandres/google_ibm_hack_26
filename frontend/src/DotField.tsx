import { useEffect, useRef } from 'react'

/**
 * Decorative halftone field behind a whole page (from the cool-ui branch). The pattern stays put;
 * the only movement is a swell that follows the pointer or finger. Reduced motion leaves it still.
 * The dot colour comes from CSS (`.dots` in index.css, a light mix of the brand token), so a scheme
 * change restyles it too.
 */
export default function DotField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const GAP = 14
    const REACH = 2 * 150 ** 2 // how far the pointer's pull spreads
    let raf = 0
    let color = ''
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
      ctx.fillStyle = color
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
      color = getComputedStyle(canvas).color
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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
