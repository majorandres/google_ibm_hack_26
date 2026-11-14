import {
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import { Font, type FontData } from 'three/addons/loaders/FontLoader.js'
import { buildPhone, buildStepIcon } from './props'
import { clockAngles, flight, smoothstep, trackProgress, viewProgress } from './story'
import { buildClock, buildStreet } from './street'
import { buildType, type TypeKind } from './type3d'

const FOV = 30

/**
 * The landing page's 3D layer: one transparent canvas fixed over the page. Each model is placed
 * over an empty HTML slot (`data-3d="…"`) every frame, so the page layout stays in charge.
 * Renders only when something changed. Returns a stop function that frees the GPU and the canvas.
 */
export function startWorld(root: HTMLElement, onLost: () => void): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const slot = (name: string) => root.querySelector<HTMLElement>(`[data-3d="${name}"]`)

  const canvas = document.createElement('canvas')
  canvas.className = 'lp-world'
  canvas.setAttribute('aria-hidden', 'true')
  // Created before the canvas joins the page, so a failed context leaves nothing behind.
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  root.append(canvas)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 10, 10000)
  const sun = new DirectionalLight('#ffffff', 1.7)
  sun.castShadow = true
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 1
  sun.shadow.radius = 3
  scene.add(new HemisphereLight('#ffffff', '#b8c2d6', 2), sun, sun.target)

  const streetEl = slot('street')
  const trackEl = slot('track')
  const clockEl = slot('clock')
  const phoneEl = slot('phone')
  const street = buildStreet()
  const heroClock = buildClock()
  const phone = buildPhone(renderer.capabilities.getMaxAnisotropy())
  const icons = ([0, 1, 2] as const).map((kind) => ({ icon: buildStepIcon(kind), el: slot(`step-${kind}`) }))
  const stepsEl = icons[0]?.el?.closest<HTMLElement>('.lp-steps') ?? null
  scene.add(street.group, heroClock.group, phone.group, ...icons.map((i) => i.icon.group))

  // Real 3D letters for the headings and numbers, once the font arrives. Until then, or if it never
  // does, the HTML text shows. `data-type="on"` tells the page's CSS to hide the HTML text.
  const typeEls = [...root.querySelectorAll<HTMLElement>('[data-3d-text]')]
  let type: { item: ReturnType<typeof buildType>; el: HTMLElement; kind: TypeKind; index: number }[] = []
  let relayout = true
  fetch(`${import.meta.env.BASE_URL}fonts/space-grotesk-bold.typeface.json`)
    .then((r) => (r.ok ? (r.json() as Promise<FontData>) : Promise.reject(new Error(`font: HTTP ${r.status}`))))
    .then((data) => {
      if (stopped) return
      const font = new Font(data)
      const counts: Partial<Record<TypeKind, number>> = {}
      type = typeEls.map((el) => {
        const kind = (el.getAttribute('data-3d-text') ?? 'heading') as TypeKind
        const index = (counts[kind] = (counts[kind] ?? -1) + 1)
        const item = buildType(el, font, kind)
        scene.add(item.group)
        return { item, el, kind, index }
      })
      relayout = true
      root.setAttribute('data-type', 'on')
      settle = Math.max(settle, 30)
      request()
    })
    .catch(() => {})

  // Reduced motion: no flight. The hero keeps its clock and the street gets its own, both still.
  if (reduce) {
    const streetClock = buildClock()
    const still = clockAngles(0.6)
    streetClock.set(still.minute, still.hour)
    street.clockMount.add(streetClock.group)
    heroClock.set(0, 270)
  }

  let w = 0
  let h = 0
  function fit() {
    w = canvas.clientWidth
    h = canvas.clientHeight
    renderer.setSize(w, h, false)
    // At this distance the plane z = 0 maps 1:1 to CSS pixels.
    camera.aspect = w / h
    camera.position.set(0, 0, h / 2 / Math.tan(MathUtils.degToRad(FOV / 2)))
    camera.far = camera.position.z + 4000
    camera.updateProjectionMatrix()
    const span = Math.max(w, h) * 0.8
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 10, far: 8000 })
    sun.shadow.camera.updateProjectionMatrix()
    sun.position.set(-0.4, 0.9, 1.2).multiplyScalar(3000)
    const size = w > 700 ? 2048 : 1024
    if (sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size)
      sun.shadow.map?.dispose()
      sun.shadow.map = null
    }
  }

  /** Centres a model on an element's box and scales it; returns the box, or null without a slot. */
  function place(obj: Object3D, el: HTMLElement | null, scale: (r: DOMRect) => number) {
    if (!el) {
      obj.visible = false
      return null
    }
    const r = el.getBoundingClientRect()
    obj.visible = r.bottom > -h * 0.5 && r.top < h * 1.5
    obj.position.set(r.left + r.width / 2 - w / 2, h / 2 - (r.top + r.height / 2), 0)
    obj.scale.setScalar(scale(r))
    return r
  }

  const mount = new Vector3()
  const mountTurn = new Quaternion()
  const facing = new Quaternion()
  const spin = new Quaternion()
  const UP = new Vector3(0, 1, 0)
  function frame() {
    const stage = place(street.group, streetEl, (r) => r.width / 800)
    const track = trackEl?.getBoundingClientRect()
    const p = reduce ? 0.6 : track ? trackProgress(track.top, track.height, h) : 0
    street.update(p)
    street.group.updateMatrixWorld(true)

    const hero = place(heroClock.group, clockEl, (r) => r.width / 68)
    if (!reduce && hero && stage && track) {
      // The hero clock flies down onto the street's clock post, then runs with the story.
      const f = flight(window.scrollY, track.top + window.scrollY)
      street.clockMount.getWorldPosition(mount)
      street.clockMount.getWorldQuaternion(mountTurn)
      // It arcs out to the side (clear of the headline) and toward you, spinning once on the way.
      const arc = Math.sin(Math.PI * f)
      heroClock.group.position.lerp(mount, f)
      heroClock.group.position.x += arc * Math.min(w * 0.36, 560)
      heroClock.group.position.z += arc * 220
      heroClock.group.quaternion.slerpQuaternions(facing, mountTurn, f).multiply(spin.setFromAxisAngle(UP, Math.PI * 2 * f))
      heroClock.group.scale.setScalar(MathUtils.lerp(hero.width / 68, stage.width / 800, f))
      heroClock.group.visible = f < 1 || street.group.visible
      const { minute, hour } = clockAngles(p)
      heroClock.set(minute, hour)
    }

    const phoneBox = place(phone.group, phoneEl, (r) => Math.min(r.width / phone.width, r.height / phone.height))
    if (phoneBox) phone.update(reduce ? 0.5 : viewProgress(phoneBox.top, phoneBox.height, h))

    const steps = stepsEl?.getBoundingClientRect()
    for (const { icon, el } of icons) {
      if (place(icon.group, el, (r) => r.width / icon.width)) icon.update(reduce || !steps ? 1 : viewProgress(steps.top, steps.height, h))
    }

    // Letters: re-measured only when the layout may have changed; placed and moved every frame.
    if (relayout || settle > 0) {
      relayout = false
      for (const t of type) t.item.layout()
    }
    for (const { item, el, kind, index } of type) {
      const r = el.getBoundingClientRect()
      item.place(r, w, h)
      if (kind === 'hero') item.update(reduce ? 0 : smoothstep(window.scrollY / (r.top + window.scrollY + r.height)))
      else {
        const stagger = kind === 'number' ? index * 0.05 : 0
        item.update(reduce ? 1 : smoothstep((viewProgress(r.top, r.height, h) - 0.02 - stagger) / 0.28))
      }
    }

    renderer.render(scene, camera)
  }

  // Render on demand. Keep rendering briefly after start and resize while the layout settles.
  let raf = 0
  let settle = 90
  const request = () => {
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const tick = () => {
    raf = 0
    frame()
    if (settle > 0) {
      settle--
      request()
    }
  }
  const onResize = () => {
    fit()
    relayout = true
    settle = 30
    request()
  }

  let stopped = false
  const observer = new ResizeObserver(() => {
    relayout = true
    request()
  })
  const lost = (event: Event) => {
    event.preventDefault()
    stop()
    onLost()
  }
  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', request)
    window.removeEventListener('resize', onResize)
    observer.disconnect()
    canvas.removeEventListener('webglcontextlost', lost)
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return
      o.geometry.dispose()
      for (const m of [o.material].flat() as (Material & { map?: Texture | null })[]) {
        m.map?.dispose()
        m.dispose()
      }
    })
    renderer.dispose()
    canvas.remove()
    root.removeAttribute('data-type')
  }

  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', onResize)
  observer.observe(root)
  canvas.addEventListener('webglcontextlost', lost)
  void document.fonts?.ready.then(() => {
    if (stopped) return
    phone.redraw()
    relayout = true
    request()
  })
  fit()
  request()
  return stop
}
