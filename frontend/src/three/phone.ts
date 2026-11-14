import {
  CanvasTexture,
  Color,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShadowMaterial,
  SRGBColorSpace,
  WebGLRenderer,
  type Material,
  type Texture,
} from 'three'

/*
 * The landing page's 3D phone (model and turn from the andres-best-frontend-3D-v1 branch).
 * Every colour and every word on its screen is read from the HTML phone it replaces, so the
 * design tokens in index.css still restyle it, and the HTML stays the accessible description.
 */

const { lerp, degToRad, clamp } = MathUtils
const FOV = 30
const BODY_W = 164
const BODY_H = 334
const SCREEN_W = 146
const SCREEN_H = 316
const PX = 4 // canvas pixels per screen unit

/** Any CSS colour (oklch, color-mix…) as rgb(), which both three.js and canvas 2D accept. */
function colorReader() {
  const c = document.createElement('canvas')
  c.width = c.height = 1
  const ctx = c.getContext('2d', { willReadFrequently: true })
  return (css: string) => {
    if (!ctx) return css
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = css
    ctx.fillRect(0, 0, 1, 1)
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
    return `rgb(${r}, ${g}, ${b})`
  }
}

type Look = ReturnType<typeof readLook>

/** The HTML phone's words and computed colours. */
function readLook(phone: HTMLElement) {
  const rgb = colorReader()
  const css = (sel: string) => {
    const el = phone.querySelector<HTMLElement>(sel)
    return { el, style: el ? getComputedStyle(el) : getComputedStyle(phone) }
  }
  const self = getComputedStyle(phone)
  const hi = css('.lp-phone-hi')
  const sub = css('.lp-phone-sub')
  const btn = css('.lp-phone-btn')
  const btn2 = css('.lp-phone-btn2')
  const firstRow = css('.lp-phone-row')
  return {
    body: rgb(self.borderTopColor),
    screen: rgb(self.backgroundColor),
    line: rgb(firstRow.style.borderTopColor),
    hi: { text: hi.el?.textContent ?? '', color: rgb(hi.style.color) },
    sub: { text: sub.el?.textContent ?? '', color: rgb(sub.style.color) },
    btn: { text: btn.el?.textContent ?? '', fill: rgb(btn.style.backgroundColor), color: rgb(btn.style.color) },
    btn2: { text: btn2.el?.textContent ?? '', color: rgb(btn2.style.color) },
    rows: [...phone.querySelectorAll<HTMLElement>('.lp-phone-row')].map((row) => {
      const [label, chip] = [...row.children] as HTMLElement[]
      const chipStyle = chip ? getComputedStyle(chip) : self
      return {
        label: label?.textContent ?? '',
        chip: chip?.textContent ?? '',
        fill: rgb(chipStyle.backgroundColor),
        color: rgb(chipStyle.color),
        ink: rgb(getComputedStyle(row).color),
      }
    }),
  }
}

function drawScreen(canvas: HTMLCanvasElement, look: Look) {
  const c = canvas.getContext('2d')
  if (!c) return
  const u = (n: number) => n * PX
  c.clearRect(0, 0, canvas.width, canvas.height)
  c.fillStyle = look.screen
  c.beginPath()
  c.roundRect(0, 0, canvas.width, canvas.height, u(16))
  c.fill()

  c.textBaseline = 'alphabetic'
  c.fillStyle = look.hi.color
  c.font = `700 ${u(14)}px "Space Grotesk", Inter, sans-serif`
  c.fillText(look.hi.text, u(12), u(40))
  c.fillStyle = look.sub.color
  c.font = `400 ${u(8)}px Inter, sans-serif`
  c.fillText(look.sub.text, u(12), u(54))

  const button = (y: number, label: string, fill: string | null, color: string) => {
    c.beginPath()
    c.roundRect(u(12), u(y), u(SCREEN_W - 24), u(26), u(6))
    if (fill) {
      c.fillStyle = fill
      c.fill()
    } else {
      c.lineWidth = u(1.5)
      c.strokeStyle = color
      c.stroke()
    }
    c.fillStyle = color
    c.font = `700 ${u(9)}px Inter, sans-serif`
    c.textAlign = 'center'
    c.fillText(label, u(SCREEN_W / 2), u(y + 16.5))
    c.textAlign = 'left'
  }
  button(66, look.btn.text, look.btn.fill, look.btn.color)
  button(98, look.btn2.text, null, look.btn2.color)

  look.rows.forEach((row, i) => {
    const y = 138 + i * 26
    c.fillStyle = look.line
    c.fillRect(u(12), u(y), u(SCREEN_W - 24), u(0.5))
    c.fillStyle = row.ink
    c.font = `400 ${u(7)}px Inter, sans-serif`
    c.fillText(row.label, u(13), u(y + 15))
    c.font = `700 ${u(6)}px Inter, sans-serif`
    const chipW = c.measureText(row.chip).width + u(9)
    c.fillStyle = row.fill
    c.beginPath()
    c.roundRect(u(SCREEN_W - 12) - chipW, u(y + 6.5), chipW, u(12), u(6))
    c.fill()
    c.fillStyle = row.color
    c.fillText(row.chip, u(SCREEN_W - 12) - chipW + u(4.5), u(y + 14.8))
  })

  // home indicator
  c.fillStyle = look.body
  c.beginPath()
  c.roundRect(u(SCREEN_W / 2 - 20), u(SCREEN_H - 10), u(40), u(2), u(1))
  c.fill()
}

function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2
  const y = -h / 2
  return new Shape()
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
}

/** t: 0 as the phone enters at the bottom of the viewport, 1 as it leaves at the top. */
function pose(t: number) {
  const second = t > 0.5
  const a = second ? (t - 0.5) / 0.5 : t / 0.5
  return {
    yaw: second ? lerp(-12, 16, a) : lerp(-38, -12, a),
    pitch: second ? lerp(5, -6, a) : lerp(18, 5, a),
  }
}

/**
 * Draws the 3D phone over `slot` (the HTML phone) in a canvas inside `wrap`.
 * Renders only on scroll and resize while on screen. `onLost` runs if the GPU drops the context.
 * Returns a stop function that frees the GPU and removes the canvas.
 */
export function startPhone(wrap: HTMLElement, slot: HTMLElement, onLost: () => void): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const canvas = document.createElement('canvas')
  canvas.className = 'lp-phone-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  // Created before the canvas joins the page, so a failed context leaves nothing behind.
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
  wrap.append(canvas)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap

  let look = readLook(slot)
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 10, 10000)
  const sun = new DirectionalLight(look.screen, 1.7)
  sun.castShadow = true
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 1
  sun.shadow.radius = 3
  const sky = new HemisphereLight(look.screen, look.line, 2)
  scene.add(sky, sun, sun.target)

  // The model: an extruded body, a lit screen and a plane that shows only the shadow behind it.
  const group = new Group()
  const turn = new Group()
  const bodyMaterial = new MeshStandardMaterial({ color: new Color(look.body), roughness: 0.8 })
  const body = new Mesh(
    new ExtrudeGeometry(roundedRect(160, 330, 24), {
      depth: 12,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 2,
      bevelSegments: 3,
      curveSegments: 10,
    }).translate(0, 0, -6),
    bodyMaterial,
  )
  body.castShadow = true

  const screenCanvas = document.createElement('canvas')
  screenCanvas.width = SCREEN_W * PX
  screenCanvas.height = SCREEN_H * PX
  const texture = new CanvasTexture(screenCanvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
  // Unlit, like a lit screen. alphaTest cuts the rounded corners cleanly.
  const screen = new Mesh(new PlaneGeometry(SCREEN_W, SCREEN_H), new MeshBasicMaterial({ map: texture, alphaTest: 0.5 }))
  screen.position.z = 8.3

  const catcher = new Mesh(new PlaneGeometry(420, 560), new ShadowMaterial({ opacity: 0.16 }))
  catcher.position.z = -28
  catcher.receiveShadow = true

  turn.add(body, screen)
  group.add(turn, catcher)
  scene.add(group)

  const redraw = () => {
    look = readLook(slot)
    bodyMaterial.color.set(look.body)
    drawScreen(screenCanvas, look)
    texture.needsUpdate = true
  }
  redraw()

  let w = 0
  let h = 0
  function fit() {
    w = canvas.clientWidth
    h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    // At this distance the plane z = 0 maps 1:1 to the canvas's CSS pixels.
    camera.aspect = w / h
    camera.position.set(0, 0, h / 2 / Math.tan(degToRad(FOV / 2)))
    camera.far = camera.position.z + 4000
    camera.updateProjectionMatrix()
    const span = Math.max(w, h)
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 10, far: 8000 })
    sun.shadow.camera.updateProjectionMatrix()
    sun.position.set(-0.4, 0.9, 1.2).multiplyScalar(3000)
    sun.shadow.mapSize.set(1024, 1024)
  }

  function frame() {
    if (!w || !h) return
    const c = canvas.getBoundingClientRect()
    const r = slot.getBoundingClientRect()
    // Centred on the HTML phone and scaled to fit inside its box.
    group.position.set(r.left + r.width / 2 - (c.left + w / 2), c.top + h / 2 - (r.top + r.height / 2), 0)
    group.scale.setScalar(Math.min(r.width / BODY_W, r.height / BODY_H))
    const t = reduce ? 0.5 : clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1)
    const { yaw, pitch } = pose(t)
    // CSS rotateX tips the top away; three.js rotation.x tips it toward the viewer, hence the minus.
    turn.rotation.set(-degToRad(pitch), degToRad(yaw), 0, 'YXZ')
    renderer.render(scene, camera)
  }

  let raf = 0
  const request = () => {
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0
      frame()
    })
  }
  const onScroll = () => {
    if (!reduce) request()
  }

  // Scroll is only listened to while the phone is near the viewport.
  const seen = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      window.addEventListener('scroll', onScroll, { passive: true })
      request()
    } else window.removeEventListener('scroll', onScroll)
  }, { rootMargin: '25% 0px' })
  const sized = new ResizeObserver(() => {
    fit()
    request()
  })

  let stopped = false
  const lost = (event: Event) => {
    event.preventDefault()
    stop()
    onLost()
  }
  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll)
    seen.disconnect()
    sized.disconnect()
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
  }

  canvas.addEventListener('webglcontextlost', lost)
  seen.observe(wrap)
  sized.observe(wrap)
  // Webfonts change the screen's text; redraw once they are in.
  void document.fonts?.ready.then(() => {
    if (stopped) return
    redraw()
    request()
  })
  fit()
  request()
  return stop
}
