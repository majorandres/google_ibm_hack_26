import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import type { Font } from 'three/addons/loaders/FontLoader.js'
import { groupLines, type Box } from './lines'

export type TypeKind = 'hero' | 'heading' | 'number'

const SIDE_DARK = '#1E40AF' // the sides of dark letters: brand blue
const SIDE_LIGHT = '#93a7e6' // the sides of light letters, on the blue band

const paints = new Map<string, MeshStandardMaterial>()
function paint(color: string) {
  let m = paints.get(color)
  if (!m) {
    m = new MeshStandardMaterial({ color, roughness: 0.55 })
    paints.set(color, m)
  }
  return m
}

const isLight = (rgb: string) => {
  const [r = 0, g = 0, b = 0] = rgb.match(/\d+(\.\d+)?/g)?.map(Number) ?? []
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

/** The element's text as the browser laid it out: one run per line per text node, relative to the element. */
function measure(el: HTMLElement) {
  const origin = el.getBoundingClientRect()
  const range = document.createRange()
  const runs: { text: string; color: string; size: number; left: number; top: number; width: number; height: number }[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? ''
    const style = getComputedStyle(node.parentElement ?? el)
    const words: Box[] = []
    for (const match of text.matchAll(/\S+/g)) {
      const start = match.index ?? 0
      range.setStart(node, start)
      range.setEnd(node, start + match[0].length)
      const r = range.getBoundingClientRect()
      words.push({ start, end: start + match[0].length, top: r.top, bottom: r.bottom, left: r.left, right: r.right })
    }
    for (const run of groupLines(words)) {
      runs.push({
        text: text.slice(run.start, run.end),
        color: style.color,
        size: parseFloat(style.fontSize),
        left: run.left - origin.left,
        top: run.top - origin.top,
        width: run.right - run.left,
        height: run.bottom - run.top,
      })
    }
  }
  return { runs, width: origin.width, height: origin.height }
}

/**
 * Real 3D letters for one element. The element stays in the page (unseen) for layout and screen
 * readers; `layout()` rebuilds the letters when its line breaks change, `place()` follows it on screen.
 */
export function buildType(el: HTMLElement, font: Font, kind: TypeKind) {
  const group = new Group() // at the element's top-left corner
  const pivot = new Group() // the hinge: bottom edge for headings, centre for numbers
  const letters = new Group() // in element coordinates, y pointing down the page
  group.add(pivot)
  pivot.add(letters)
  const { ascender, descender, resolution, glyphs } = font.data
  const baseline = ascender / (ascender - descender) // where the baseline sits in a line box
  let signature = ''

  const advance = (text: string, size: number) =>
    [...text].reduce((sum, ch) => sum + (glyphs[ch]?.ha ?? 0), 0) * (size / resolution)

  return {
    group,
    layout() {
      const m = measure(el)
      const next = JSON.stringify([m.width | 0, m.height | 0, ...m.runs.map((r) => [r.text, r.color, r.size, r.left | 0, r.top | 0, r.width | 0])])
      if (next === signature) return
      signature = next
      for (const old of [...letters.children]) {
        if (old instanceof Mesh) old.geometry.dispose()
        letters.remove(old)
      }
      for (const run of m.runs) {
        const depth = run.size * (kind === 'heading' ? 0.16 : 0.22)
        const geometry = new ExtrudeGeometry(font.generateShapes(run.text, run.size), {
          depth,
          bevelEnabled: true,
          bevelThickness: run.size * 0.015,
          bevelSize: run.size * 0.01,
          bevelSegments: 2,
          curveSegments: 5,
        })
        // Faces in the text's own colour, sides in brand blue (light sides for light letters).
        const mesh = new Mesh(geometry, [paint(run.color), paint(isLight(run.color) ? SIDE_LIGHT : SIDE_DARK)])
        const natural = advance(run.text, run.size)
        mesh.scale.x = natural > 0 ? run.width / natural : 1 // the browser's kerning and letter-spacing
        mesh.position.set(run.left, -(run.top + run.height * baseline), 0)
        letters.add(mesh)
      }
      const hingeY = kind === 'number' ? m.height / 2 : m.height
      pivot.position.set(m.width / 2, -hingeY, 0)
      letters.position.set(-m.width / 2, hingeY, 0)
    },
    place(rect: DOMRect, w: number, h: number) {
      group.visible = rect.bottom > -h * 0.25 && rect.top < h * 1.25
      group.position.set(rect.left - w / 2, h / 2 - rect.top, 0)
    },
    /** progress: hero 0 upright → 1 folded back; heading 0 lying back → 1 upright; number 0 turned away → 1 facing you. */
    update(progress: number) {
      if (kind === 'hero') pivot.rotation.x = -progress * 1.2
      else if (kind === 'heading') pivot.rotation.x = -(1 - progress) * 1.25
      else pivot.rotation.y = (1 - progress) * Math.PI
    },
  }
}
