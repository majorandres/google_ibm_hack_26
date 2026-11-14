import {
  BoxGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type BufferGeometry,
} from 'three'
import { smoothstep, street } from './story'

export const INK = '#101828'
export const BLUE = '#1E40AF'
export const YELLOW = '#FACC15'
export const WHITE = '#ffffff'
export const TINT = '#dbe4ff'
const GREY = '#e4e7ec'
const RED = '#b42318'
const SLATE = '#475467'

const { lerp, degToRad } = MathUtils

// One matte material per colour, shared by every mesh that uses it.
const paints = new Map<string, MeshStandardMaterial>()
export function paint(color: string) {
  let m = paints.get(color)
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness: 0.8 })
    paints.set(color, m)
  }
  return m
}

export function mesh(geometry: BufferGeometry, color: string, x = 0, y = 0, z = 0) {
  const m = new Mesh(geometry, paint(color))
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export const box = (w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) =>
  mesh(new BoxGeometry(w, h, d), color, x, y, z)

const disc = (r: number, depth: number, color: string, segments = 24) =>
  mesh(new CylinderGeometry(r, r, depth, segments).rotateX(Math.PI / 2), color)

/** A station clock facing +z, about 68 units across. */
export function buildClock() {
  const group = new Group()
  group.add(disc(30, 6, WHITE, 48), mesh(new TorusGeometry(31, 3.2, 10, 48), INK))
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const tick = box(2, i % 3 === 0 ? 7 : 4, 1, INK, Math.sin(a) * 24, Math.cos(a) * 24, 3.2)
    tick.rotation.z = -a
    group.add(tick)
  }
  const hand = (length: number, width: number, color: string, z: number) => {
    const m = mesh(new BoxGeometry(width, length, 1.5).translate(0, length / 2 - 3, 0), color, 0, 0, z)
    group.add(m)
    return m
  }
  const hour = hand(17, 4, INK, 4)
  const minute = hand(24, 2.6, BLUE, 5.2)
  const cap = disc(3.2, 2, INK, 16)
  cap.position.z = 6.2
  group.add(cap)
  return {
    group,
    /** Degrees clockwise from 12, as story.clockAngles gives them. */
    set(minuteDeg: number, hourDeg: number) {
      minute.rotation.z = -degToRad(minuteDeg)
      hour.rotation.z = -degToRad(hourDeg)
    },
  }
}

/** The wheelchair symbol, drawn once for the van's door window. */
function wheelchairDecal() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const c = canvas.getContext('2d')
  if (c) {
    c.translate(32, 34)
    c.scale(2.6, 2.6)
    c.strokeStyle = c.fillStyle = BLUE
    c.lineWidth = 2.5
    c.lineCap = 'round'
    c.beginPath()
    c.arc(0, -8, 3, 0, Math.PI * 2)
    c.fill()
    c.stroke(new Path2D('M0 -4 v7 h7'))
    c.beginPath()
    c.arc(1, 9, 6, 0, Math.PI * 2)
    c.stroke()
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return new Mesh(new PlaneGeometry(22, 22), new MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.8 }))
}

/**
 * The street set. Native units follow the old 800×300 SVG: x = svgX − 400, ground at y = 0,
 * depth runs from the back of the buildings (z −170) to the front of the board (z 100).
 * The group's origin is the stage centre (SVG y 150), so world.ts can place it over the stage.
 */
export function buildStreet() {
  const group = new Group()
  const set = new Group()
  set.position.y = -100
  group.add(set)

  // The board: a blue slab, sidewalk, curb, road and lane dashes, wider than any screen.
  const flat = [
    box(2400, 16, 270, BLUE, 0, -8, -35),
    box(2400, 2, 160, '#e9edf3', 0, 1, -90),
    box(2400, 4, 4, INK, 0, 2, -10),
    box(2400, 1, 110, '#d0d5dd', 0, 0.5, 45),
  ]
  for (const m of flat) m.castShadow = false
  const dashes = new InstancedMesh(new BoxGeometry(48, 1.2, 4), paint(YELLOW), 27)
  const at = new Matrix4()
  for (let i = 0; i < 27; i++) dashes.setMatrixAt(i, at.makeTranslation(-1170 + i * 90, 1.2, 82))
  dashes.receiveShadow = true
  set.add(...flat, dashes)

  // Pop-up pieces hinge on their back bottom edge, lying flat until the story starts.
  const popups: Group[] = []
  const popup = (x: number, hingeZ: number, ...parts: Object3D[]) => {
    const pivot = new Group()
    pivot.position.set(x, 0, hingeZ)
    pivot.add(...parts)
    popups.push(pivot)
    set.add(pivot)
  }

  const roof = new ExtrudeGeometry(new Shape().moveTo(-65, 0).lineTo(0, 46).lineTo(65, 0).closePath(), {
    depth: 90,
    bevelEnabled: false,
  }).translate(0, 0, -45)
  popup(-305, -150, box(110, 100, 80, GREY, 0, 50, 40), mesh(roof, INK, 0, 100, 40), box(30, 50, 2, BLUE, 0, 25, 81))

  const door = box(34, 54, 2, BLUE, 0, 27, 91)
  const shut = new Group()
  shut.position.set(0, 27, 92.5)
  shut.add(box(28, 4, 1, WHITE).rotateZ(Math.PI / 4), box(28, 4, 1, WHITE).rotateZ(-Math.PI / 4))
  popup(
    305,
    -160,
    box(130, 120, 90, GREY, 0, 60, 45),
    box(130, 18, 90, INK, 0, 129, 45),
    box(38, 14, 3, RED, 0, 97, 91),
    box(14, 38, 3, RED, 0, 97, 91),
    door,
    shut,
  )

  // The rider, in a wheelchair on the sidewalk by the curb, facing the road.
  const torus = (r: number, tube: number, x: number, y: number, z: number) => mesh(new TorusGeometry(r, tube, 8, 32), INK, x, y, z)
  const rider = new Group()
  rider.position.z = 17
  rider.add(
    torus(20, 2.6, 6, 22, 14),
    torus(20, 2.6, 6, 22, -14),
    torus(7, 2, 34, 9, 12),
    torus(7, 2, 34, 9, -12),
    box(30, 4, 26, INK, 12, 40, 0),
    box(4, 28, 26, INK, -4, 56, 0),
    box(10, 3, 18, INK, 32, 15, 0),
    mesh(new CapsuleGeometry(7, 22, 4, 12), SLATE, 2, 64, 0),
    box(26, 9, 16, SLATE, 14, 47, 0),
    box(8, 24, 14, SLATE, 28, 32, 0),
    mesh(new SphereGeometry(11, 20, 16), INK, 2, 92, 0),
  )
  popup(-170, -57, rider)

  // The clock post. The clock itself is separate: it flies in from the hero (world.ts).
  set.add(mesh(new CylinderGeometry(2.5, 2.5, 146, 12), INK, 0, 73, -60))
  const clockMount = new Object3D()
  clockMount.position.set(0, 176, -60)
  set.add(clockMount)

  // The paratransit van, extruded from the SVG van's side profile; it drives toward +x.
  const profile = new Shape()
    .moveTo(-84, 16)
    .lineTo(-84, 112)
    .absarc(-72, 112, 12, Math.PI, Math.PI / 2, true)
    .lineTo(46, 124)
    .absarc(46, 112, 12, Math.PI / 2, 0, true)
    .lineTo(58, 90)
    .lineTo(84, 64)
    .lineTo(84, 16)
    .closePath()
  const body = new ExtrudeGeometry(profile, { depth: 60, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 2, curveSegments: 8 })
  const van = new Group()
  van.position.z = 35
  van.add(mesh(body.translate(0, 0, -30), BLUE), box(2, 20, 46, TINT, 61.5, 101, 0))
  for (const side of [1, -1]) {
    van.add(
      box(44, 34, 1, TINT, -46, 91, side * 33.6),
      box(44, 34, 1, TINT, 8, 91, side * 33.6),
      box(152, 9, 1, YELLOW, 8, 57.5, side * 33.7),
      box(2, 7, 10, YELLOW, 85.5, 44, side * 20),
    )
  }
  const decal = wheelchairDecal()
  decal.position.set(8, 91, 34.3)
  van.add(decal)
  const wheels: Group[] = []
  for (const x of [-48, 56]) {
    for (const z of [28, -28]) {
      const wheel = new Group()
      wheel.position.set(x, 16, z)
      const tire = mesh(new CylinderGeometry(16, 16, 10, 24).rotateX(Math.PI / 2), INK)
      const hub = mesh(new CylinderGeometry(7, 7, 11, 16).rotateX(Math.PI / 2), '#98a2b3')
      wheel.add(tire, hub, box(12, 3, 11.5, SLATE))
      wheels.push(wheel)
      van.add(wheel)
    }
  }
  set.add(van)

  // The missed appointment: a calendar with a red X that rises and turns to face the viewer.
  const calendar = new Group()
  calendar.add(
    box(68, 60, 6, WHITE),
    box(68, 16, 7, BLUE, 0, 22, 0),
    box(38, 5, 2, RED, 0, -6, 3.6).rotateZ(0.75),
    box(38, 5, 2, RED, 0, -6, 3.6).rotateZ(-0.75),
  )
  set.add(calendar)

  return {
    group,
    clockMount,
    update(p: number) {
      const s = street(p)
      for (const piece of popups) piece.rotation.x = -(1 - s.rise) * 1.45
      van.position.x = s.vanPast > 0 ? lerp(-56, 1300, s.vanPast) : lerp(-1300, -56, s.vanIn)
      for (const wheel of wheels) wheel.rotation.z = -van.position.x / 16
      door.material = paint(s.missed ? SLATE : BLUE)
      shut.visible = s.missed
      const v = smoothstep(s.verdict)
      calendar.visible = s.verdict > 0
      calendar.position.set(120, lerp(40, 205, v), lerp(-150, 70, v))
      calendar.scale.setScalar(lerp(0.6, 1.3, v))
      // Undo the set's tilt and swing so the calendar ends squarely facing the viewer.
      calendar.rotation.set(-degToRad(s.tilt) * v, -degToRad(s.orbit) * v, 0, 'YXZ')
      group.rotation.set(degToRad(s.tilt), degToRad(s.orbit), 0)
    },
  }
}
