import {
  BoxGeometry,
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Shape,
  ShadowMaterial,
  SRGBColorSpace,
  type Object3D,
} from 'three'
import { smoothstep } from './story'
import { BLUE, box, INK, mesh, TINT, WHITE, YELLOW } from './street'

const { lerp, degToRad } = MathUtils

/** Shows only the shadows falling on it: the page behind a model. */
function shadowCatcher(w: number, h: number, z: number) {
  const m = new Mesh(new PlaneGeometry(w, h), new ShadowMaterial({ opacity: 0.16 }))
  m.position.z = z
  m.receiveShadow = true
  return m
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

const SCREEN_W = 146
const SCREEN_H = 316
const PX = 4 // canvas pixels per screen unit

/** The RideRecord home screen, the same preview the HTML phone shows. */
function drawHomeScreen(canvas: HTMLCanvasElement) {
  const c = canvas.getContext('2d')
  if (!c) return
  const u = (n: number) => n * PX
  c.clearRect(0, 0, canvas.width, canvas.height)
  c.fillStyle = WHITE
  c.beginPath()
  c.roundRect(0, 0, canvas.width, canvas.height, u(16))
  c.fill()

  c.textBaseline = 'alphabetic'
  c.fillStyle = INK
  c.font = `700 ${u(14)}px "Space Grotesk", Inter, sans-serif`
  c.fillText('Hi, Denise', u(12), u(40))
  c.fillStyle = '#475467'
  c.font = `400 ${u(8)}px Inter, sans-serif`
  c.fillText('How was today’s ride?', u(12), u(54))

  const button = (y: number, label: string, filled: boolean) => {
    c.beginPath()
    c.roundRect(u(12), u(y), u(SCREEN_W - 24), u(26), u(6))
    if (filled) {
      c.fillStyle = BLUE
      c.fill()
    } else {
      c.lineWidth = u(1.5)
      c.strokeStyle = BLUE
      c.stroke()
    }
    c.fillStyle = filled ? WHITE : BLUE
    c.font = `700 ${u(9)}px Inter, sans-serif`
    c.textAlign = 'center'
    c.fillText(label, u(SCREEN_W / 2), u(y + 16.5))
    c.textAlign = 'left'
  }
  button(66, 'Log a ride', true)
  button(98, 'Talk instead', false)

  const rows: [string, string, string, string][] = [
    ['Modivcare · Nov 12', 'To file', '#fef3c7', '#92400e'],
    ['SMART ADA · Nov 8', 'Filed', TINT, BLUE],
    ['DDOT Now · Nov 4', 'On time', '#dcfae6', '#067647'],
  ]
  rows.forEach(([ride, status, chipFill, chipText], i) => {
    const y = 138 + i * 26
    c.fillStyle = '#e4e7ec'
    c.fillRect(u(12), u(y), u(SCREEN_W - 24), u(0.5))
    c.fillStyle = INK
    c.font = `400 ${u(7)}px Inter, sans-serif`
    c.fillText(ride, u(13), u(y + 15))
    c.font = `700 ${u(6)}px Inter, sans-serif`
    const chipW = c.measureText(status).width + u(9)
    c.fillStyle = chipFill
    c.beginPath()
    c.roundRect(u(SCREEN_W - 12) - chipW, u(y + 6.5), chipW, u(12), u(6))
    c.fill()
    c.fillStyle = chipText
    c.fillText(status, u(SCREEN_W - 12) - chipW + u(4.5), u(y + 14.8))
  })

  c.fillStyle = INK
  c.beginPath()
  c.roundRect(u(SCREEN_W / 2 - 20), u(SCREEN_H - 10), u(40), u(2), u(1))
  c.fill()
}

/** A phone, 164 × 334 units, showing the home screen. `update(t)` turns it with scroll progress. */
export function buildPhone(maxAnisotropy: number) {
  const group = new Group()
  const turn = new Group()
  group.add(turn, shadowCatcher(420, 560, -28))

  const body = new ExtrudeGeometry(roundedRect(160, 330, 24), {
    depth: 12,
    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 2,
    bevelSegments: 3,
    curveSegments: 10,
  }).translate(0, 0, -6)
  turn.add(mesh(body, INK))

  const canvas = document.createElement('canvas')
  canvas.width = SCREEN_W * PX
  canvas.height = SCREEN_H * PX
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = maxAnisotropy
  // Unlit, like a lit screen. alphaTest cuts the rounded corners cleanly.
  const screen = new Mesh(new PlaneGeometry(SCREEN_W, SCREEN_H), new MeshBasicMaterial({ map: texture, alphaTest: 0.5 }))
  screen.position.z = 8.3
  turn.add(screen)

  const redraw = () => {
    drawHomeScreen(canvas)
    texture.needsUpdate = true
  }
  redraw()

  return {
    group,
    width: 164,
    height: 334,
    redraw,
    /** t: 0 entering at the bottom, 1 leaving at the top (the old CSS keyframes, in 3D). */
    update(t: number) {
      const second = t > 0.5
      const a = second ? (t - 0.5) / 0.5 : t / 0.5
      const yaw = second ? lerp(-12, 16, a) : lerp(-38, -12, a)
      const pitch = second ? lerp(5, -6, a) : lerp(18, 5, a)
      // CSS rotateX tips the top away; three.js rotation.x tips it toward the viewer, hence the minus.
      turn.rotation.set(-degToRad(pitch), degToRad(yaw), 0, 'YXZ')
    },
  }
}

/**
 * The three "How it works" icons, 48 units wide: 0 clipboard with a check, 1 letter, 2 bar chart.
 * `update(t)` turns the icon up from edge-on as its card stands, staggered like the cards.
 */
export function buildStepIcon(kind: 0 | 1 | 2) {
  const group = new Group()
  const turn = new Group()
  group.add(turn, shadowCatcher(120, 120, -14))
  const bars: Object3D[] = []

  if (kind === 0) {
    turn.add(
      box(30, 38, 4, BLUE),
      box(23, 29, 1.5, WHITE, 0, -2, 2.6),
      box(13, 5, 5, INK, 0, 18, 1),
      box(6.5, 2.6, 1.5, BLUE, -4, 2, 3.6).rotateZ(-Math.PI / 4),
      box(12, 2.6, 1.5, BLUE, 2, 4, 3.6).rotateZ(Math.PI / 4),
      box(12, 2.6, 1.5, BLUE, 0, -9, 3.6),
    )
  } else if (kind === 1) {
    const page = new Shape().moveTo(-12, 16).lineTo(4, 16).lineTo(12, 8).lineTo(12, -16).lineTo(-12, -16).closePath()
    const fold = new Shape().moveTo(4, 16).lineTo(4, 8).lineTo(12, 8).closePath()
    turn.add(
      mesh(new ExtrudeGeometry(page, { depth: 3, bevelEnabled: false }).translate(0, 0, -1.5), TINT),
      mesh(new ExtrudeGeometry(fold, { depth: 1, bevelEnabled: false }), BLUE, 0, 0, 1.6),
      box(12, 2.6, 1, BLUE, 0, 0, 2),
      box(12, 2.6, 1, BLUE, 0, -6, 2),
    )
    turn.scale.setScalar(1.35) // the page is narrower than the other two icons
  } else {
    turn.add(box(34, 2.5, 10, INK, 0, -16, 0))
    for (const [x, h, color] of [[-9, 16, BLUE], [1, 24, BLUE], [11, 32, YELLOW]] as const) {
      const bar = mesh(new BoxGeometry(6, h, 8).translate(0, h / 2, 0), color, x, -14.75, 0)
      bars.push(bar)
      turn.add(bar)
    }
  }

  return {
    group,
    width: 48,
    update(t: number) {
      const a = smoothstep((t - kind * 0.04) / 0.3)
      turn.rotation.set(degToRad(12), lerp(-Math.PI / 2, degToRad(-28), a), 0, 'YXZ')
      const grow = Math.max(0.02, smoothstep((t - 0.12 - kind * 0.04) / 0.3))
      for (const bar of bars) bar.scale.y = grow
    },
  }
}
