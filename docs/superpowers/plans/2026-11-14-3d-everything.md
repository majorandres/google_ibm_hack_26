# 3D everything Implementation Plan

> **For agentic workers:** executed inline in the session that wrote it, right after the user approved the design. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every component, button, number and piece of text on RideRecord has depth; clicks feel physical.

**Architecture:** WebGL letters for landing headings and numbers in the existing world (`type3d.ts`, measured from the real HTML); CSS solid type and slabs everywhere else; one delegated pointer-tilt module for the whole site.

**Tech Stack:** React 19, Vite 8, Tailwind 4, three 0.187 (`Font` from addons), opentype.js only in a scratch conversion script.

## Global Constraints

- No new runtime or dev dependencies. The font ships as JSON plus its OFL licence.
- Tilt uses the `rotate` property; lift and press use `translate`; animations keep `transform`.
- Reduced motion: depth only. No WebGL or font: HTML text with CSS depth.
- axe: zero violations on the landing page and all five app screens.

---

### Task 1: Pure helpers, tests first
**Files:** Create `frontend/src/three/lines.ts`, `frontend/src/tilt.ts` (pure `tiltFor` first), `frontend/tests/lines.test.ts`, `frontend/tests/tilt.test.ts`; `package.json` test script runs all tests.
**Produces:** `groupLines(words: WordBox[]): Run[]` where `WordBox = { start, end, top, bottom, left, right }`, `Run = { start, end, top, bottom, left, right }`; `tiltFor(x, y, box: { left, top, width, height }, max: number): { x: number; y: number; angle: number } | null`.
- [ ] Write both tests; run; see them fail.
- [ ] Implement; run; see them pass.

### Task 2: Font data
**Files:** Create `frontend/public/fonts/space-grotesk-bold.typeface.json`, `frontend/public/fonts/OFL.txt`.
- [ ] Scratch script: opentype.js parses `@fontsource/space-grotesk` latin-700 WOFF; writes typeface JSON (resolution 1000, chars: printable ASCII + ‘ ’ “ ” – — ·).
- [ ] Render a test word in the world and check counters (holes in "a", "e", "o") are open.

### Task 3: WebGL letters
**Files:** Create `frontend/src/three/type3d.ts`; modify `frontend/src/three/world.ts`.
**Produces:** `buildType(el: HTMLElement, font: Font, kind: 'hero' | 'heading' | 'number', index: number)` → `{ group, layout(): void, place(rect, w, h): void, update(t: number): void }`.
- [ ] Measure runs per text node with `Range`, build extruded meshes, scale to run width, baseline from font metrics.
- [ ] World: fetch the font after start, build items for `[data-3d-text]`, re-layout on resize and font load, animate per kind, set `data-type="on"`; clear it on stop.

### Task 4: Landing markup and CSS
**Files:** Modify `frontend/src/Landing.tsx`.
- [ ] `data-3d-text` on h1, the five h2s, the stat numbers.
- [ ] `[data-type='on']`: hide those (opacity 0), turn off their and their containers' transforms, move fold/swing/tilt to sibling text.
- [ ] Solid type, slabs (steps, stats, FAQ tiles, band bevel), keys use `translate`, containers get `perspective`.

### Task 5: App depth and tilt
**Files:** Modify `frontend/src/index.css`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/Dashboard.tsx`, `frontend/src/VoiceLog.tsx`.
- [ ] Press and lift move to `translate`; solid type for titles, legends, buttons, numbers; body edge; chip and status edges; deadline groove; `.slab`; avatar edge; `perspective` on direct parents of tilt targets.
- [ ] `startTilt()` from `main.tsx`.

### Task 6: Verify
- [ ] `npm test`, `npm run build`, `npm run lint`.
- [ ] Screenshots desktop and phone; reduced motion; WebGL off; a hover-tilt frame.
- [ ] axe on landing and all app screens; keyboard pass.
