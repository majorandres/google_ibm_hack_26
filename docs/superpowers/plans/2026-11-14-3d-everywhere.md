# 3D everywhere Implementation Plan

> **For agentic workers:** executed inline in the session that wrote it (the user asked to build straight away). Steps use checkbox (`- [ ]`) syntax for tracking. The code itself lives in the files named per task; this plan fixes the interfaces and the checks.

**Goal:** Every piece of RideRecord is 3D: three.js models that move with scroll on the landing page, calm tap-driven CSS 3D in the app.

**Architecture:** One transparent, fixed WebGL canvas over the landing page with a pixel-mapped perspective camera. Each model is bound to an HTML slot (`data-3d`) and placed over it every frame; rendering happens only on change. Pure scroll math lives in `story.ts`, shared with the existing CSS fallback. The app gets CSS-only depth and tap motion in `index.css`.

**Tech Stack:** React 19, Vite 8, Tailwind 4, TypeScript 7, `three` 0.187 (+ `@types/three` 0.187), Node 22 for the math test.

## Global Constraints

- One runtime dependency added: `three`. One dev dependency: `@types/three`. Nothing else.
- `three` loads only in a lazy chunk from `Landing`; never in the main chunk or the app.
- Fallback visuals stay the default; `lp-3d` hides them only after the world starts.
- Every animation has a `prefers-reduced-motion` path: 3D stays, motion stops.
- Canvas `aria-hidden`, `pointer-events: none`; no control below 44 px; focus rings unchanged.
- Brand colours: blue `#1E40AF`, yellow `#FACC15`, ink `#101828`, grey `#e4e7ec`, red `#b42318`, tint `#dbe4ff`.
- Clock reads 9:00 in the hero, runs 9:00 → 9:20 across the street story.

---

### Task 1: Scroll math (`story.ts`) with tests first

**Files:** Create `frontend/src/three/story.ts`, `frontend/tests/story.test.ts`. Modify `frontend/package.json` (`"test": "node tests/story.test.ts"`).

**Produces:**
- `clamp(n: number, lo = 0, hi = 1): number`
- `smoothstep(t: number): number`
- `trackProgress(top: number, height: number, viewportH: number): number`
- `viewProgress(top: number, height: number, viewportH: number): number`
- `street(p: number): { rise, vanIn, vanPast, verdict, missed, tilt, orbit, phase }` (tilt/orbit in degrees, phase 0–3)
- `clockAngles(p: number): { minute: number; hour: number }` (degrees clockwise from 12)
- `flight(scrollY: number, trackTop: number): number`

- [ ] Write `tests/story.test.ts` with `node:assert/strict` covering phase boundaries (p 0, 0.15, 0.3, 0.6, 0.85, 1), clamping below 0 and above 1, clock 9:00 at p 0 and 9:20 at p 1, flight 0 at top and 1 at the track.
- [ ] Run `npm test`; expect failure (module missing).
- [ ] Implement `story.ts`.
- [ ] Run `npm test`; expect pass.

### Task 2: The world (`world.ts`) and the dependency

**Files:** Create `frontend/src/three/world.ts`. Modify `frontend/package.json` (via `npm install three@0.187.0 && npm install -D @types/three@0.187.0`).

**Consumes:** `story.ts`; `buildStreet`, `buildClock` (Task 3); `buildPhone`, `buildStepIcon` (Task 4).

**Produces:** `startWorld(root: HTMLElement, onLost: () => void): () => void`. Reads `[data-3d="street"]`, `[data-3d="track"]`, `[data-3d="clock"]`, `[data-3d="phone"]`, `[data-3d="step-0|1|2"]` under `root`. Returns a stop function that removes listeners, disposes GPU resources and removes the canvas.

- [ ] Canvas fixed over the page, `aria-hidden`, alpha, antialias, DPR ≤ 2, soft shadows.
- [ ] Pixel camera: fov 30°, distance `h / 2 / tan(15°)`; re-fit on resize.
- [ ] Lights: hemisphere + directional (shadow camera covers the viewport; 2048 map wide, 1024 narrow).
- [ ] Anchors: per frame, `getBoundingClientRect()` → world centre and scale; hide when off screen.
- [ ] Render on demand from scroll, resize, `ResizeObserver(root)`, `document.fonts.ready`.
- [ ] Reduced motion: static poses, static second clock on the post, hero clock stays home.
- [ ] `webglcontextlost` → stop and call `onLost`.

### Task 3: Street set and clock (`street.ts`)

**Files:** Create `frontend/src/three/street.ts`.

**Produces:**
- `buildStreet(): { group: THREE.Group; clockMount: THREE.Object3D; update(p: number): void }` — native units follow the 800×300 SVG, origin at the stage centre (SVG y 150).
- `buildClock(): { group: THREE.Group; set(minuteDeg: number, hourDeg: number): void }` — native diameter 70.

- [ ] Slab 2400 wide (blue front), sidewalk, curb, road, yellow dashes.
- [ ] House, clinic (door turns grey with white X when missed), rider in wheelchair, clock post, van (extruded SVG profile, windows, stripe, wheelchair decal, rolling wheels), calendar with red X.
- [ ] `update(p)`: rise (hinge on back edge), van x −1300 → −56 → +1300, door state, calendar rise/forward/face, group tilt/orbit.

### Task 4: Phone and step icons (`props.ts`)

**Files:** Create `frontend/src/three/props.ts`.

**Produces:**
- `buildPhone(): { group: THREE.Group; aspect: number; update(t: number): void }` (t = view progress; native height 330).
- `buildStepIcon(kind: 0 | 1 | 2): { group: THREE.Group; update(t: number): void }` (native width 48).

- [ ] Phone: extruded rounded body, screen plane with canvas texture of the home preview (redrawn when fonts load), shadow-only plane behind.
- [ ] Icons: clipboard + check, letter with folded corner + lines, bar chart with growing bars; shadow-only plane behind each.

### Task 5: Landing integration and CSS 3D for the remaining landing pieces

**Files:** Modify `frontend/src/Landing.tsx`.

- [ ] `RideScene` uses `street()` / `clockAngles()` from `story.ts`; renders the anchor only when 3D is on.
- [ ] Add `data-3d` slots: street stage, track, hero clock (SVG fallback inside), phone, step icon slots (64 px).
- [ ] WebGL check → lazy `import('./three/world')` → `lp-3d` on success; cleanup on unmount; `onLost` → back to fallback.
- [ ] CSS: header folds back + logo half-turn; reveal text swings; headings come forward; stat tiles flip; FAQ answer unfolds; band tilts with button forward; footer hinges up; landing CTAs are keys. All under reduced-motion and `@supports` guards; fallback hiding under `.lp-3d`.

### Task 6: App CSS 3D

**Files:** Modify `frontend/src/index.css`, `frontend/src/App.tsx`, `frontend/src/Home.tsx`, `frontend/src/Complaints.tsx`, `frontend/src/Dashboard.tsx`.

- [ ] Keys: `.btn` and Home's two big buttons get an edge and press; disabled flat; `[aria-pressed='true']` held down.
- [ ] `.choice` lifts when checked, presses on tap; `.field` sunken.
- [ ] `.record` paper stack + deal-in (first five staggered); complaint draft drops its old fade for the same deal-in.
- [ ] Screen wrapper keyed by screen turns in; tabs pressed; logo tile depth; Patterns bars edge + grow.

### Task 7: Verify

- [ ] `npm test`, `npm run build` (report chunk sizes; `three` not in the main chunk), `npm run lint`.
- [ ] Screenshots desktop and phone at each landing stage; reduced motion; WebGL disabled.
- [ ] axe-core on the landing page and each app screen; keyboard pass on the landing page.
- [ ] Impeccable detector on changed files.
