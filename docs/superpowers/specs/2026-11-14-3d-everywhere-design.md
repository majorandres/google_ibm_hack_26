# 3D everywhere: design

Date: 2026-11-14. Branch: `lovable-ui-migration`. Builds on the CSS 3D street diorama already on this branch (`frontend/src/Landing.tsx`).

## Intent

Make every piece of RideRecord 3D. The landing page gets real three.js models that move as you scroll. The app behind "Log a ride" gets calmer 3D: physical depth and tap-driven motion, nothing that moves while a rider reads or types.

## Scope

| Piece | Technique | What happens |
|---|---|---|
| Landing header | CSS 3D | Folds back as it scrolls away; the logo makes a half-turn. CTA is a physical key. |
| Hero | three.js + CSS | A modeled station clock above the headline reads 9:00. On scroll it flies down into the street and lands on the street's clock post. The headline folds back (existing). |
| Street story | three.js | House, clinic, rider in a wheelchair, van, clock post, calendar and a full-width road, modeled with light and shadow. Same story: pieces stand up, the van drives past, the clinic door shuts, a calendar with an X comes forward. The set tilts and swings with scroll. Caption stays HTML. |
| App reveal | three.js + CSS | A modeled phone with the RideRecord home screen on its glass turns as it passes. The text beside it swings in the opposite way (CSS). |
| How it works | three.js + CSS | Step icons become models (clipboard with check, letter, bar chart whose bars rise) that turn upright as their cards stand up (existing CSS). |
| Section headings | CSS 3D | Come forward out of depth as they enter. |
| Why it matters | CSS 3D | Stat tiles flip into place like transit departure-board flaps. |
| FAQ | CSS 3D | An answer unfolds downward when its question is opened. |
| CTA band | CSS 3D | The band tilts up toward you; its button stands forward of the band. |
| Footer | CSS 3D | Hinges up into place at the end of the page. |
| App buttons | CSS 3D | Physical keys with a visible edge that press in on tap. Disabled buttons are flat. "Tap to talk" stays pressed in while recording. |
| App answer tiles | CSS 3D | The picked tile lifts toward you; tiles press in on tap. |
| App fields | CSS 3D | Sunken wells. |
| App records | CSS 3D | Look like a small stack of paper; deal in (tilt and settle) when a screen opens. The complaint draft unfolds the same way when it arrives. |
| App screen change | CSS 3D | The new screen turns in like a page, about 0.3 s. |
| App tabs and logo | CSS 3D | The current tab looks pressed in; tabs press on tap; the logo tile has depth. |
| Patterns bars | CSS 3D | Bars get a visible edge and grow in when the screen opens. |

Non-goals: scroll-driven motion in the app; hover-tilt effects; downloaded model files (glTF); react-three-fiber or any helper library beyond `three`; a sticky header; new copy beyond the clock.

## Approaches considered

- **A. Extend the CSS paper theatre.** No dependency, light, but flat cut-outs rather than modeled objects.
- **B. Real 3D models with three.js. Chosen by the user.** Modeled objects with light and shadow for the landing page; the app stays CSS. Costs one runtime dependency (`three`) plus `@types/three`, a lazy chunk, and modeling in code.
- **C. One continuous camera flight through the landing.** Most dramatic, but text sits at an angle most of the time; rejected for readability and accessibility (judging criterion J3).

## Design

### Architecture

- **One transparent WebGL canvas** fixed over the landing page: `position: fixed; inset: 0; pointer-events: none; aria-hidden="true"`. One renderer, one scene, one camera, one render loop.
- **Pixel camera.** A `PerspectiveCamera` (fov 30°) sits at the distance where the plane z = 0 maps 1:1 to CSS pixels. World x/y equal viewport pixels around the centre, so a model can be placed exactly over any element.
- **Anchors.** Each model is bound to an empty slot in the normal HTML layout, marked `data-3d="<name>"`. Every frame the model is placed at its slot's on-screen centre and scaled to its slot's width (height for the phone). HTML stays the source of truth for layout and responsiveness; models scroll with the page.
- **Render on demand.** Scroll, resize, layout changes (`ResizeObserver` on the landing root) and font loading mark the frame dirty; one `requestAnimationFrame` updates models and renders. Nothing renders while the page is still.
- **Culling.** A model whose slot is off screen is hidden.
- **Lazy load.** `Landing` checks for WebGL, then `import('./three/world')` after first paint. `three` lives only in that chunk; the app (`#app`) never downloads it.
- **Progressive enhancement.** Today's visuals (CSS street, HTML phone, SVG icons, an SVG hero clock) are the default. When the world starts it calls back and `Landing` adds `lp-3d` to its root; CSS then hides the fallback visuals but keeps their boxes (they are the anchors). If WebGL is missing, three.js fails to load, or the context is lost, the fallback stays or comes back.

### Files

- `frontend/src/three/story.ts`: pure scroll math shared by the 3D world and the CSS fallback (clamp, element progress, the street story's values, clock time, clock flight). No three.js import.
- `frontend/src/three/world.ts`: renderer, camera, lights, anchors, render loop, resize, context loss, cleanup. Exports `startWorld(root, onLost)` returning a stop function.
- `frontend/src/three/street.ts`: the street set and the clock model.
- `frontend/src/three/props.ts`: the phone (screen drawn to a canvas texture) and the three step icons.
- `frontend/tests/story.test.ts`: assertions for `story.ts`, run with `node tests/story.test.ts` (Node 22 strips the types).
- Edited: `Landing.tsx`, `App.tsx`, `Home.tsx`, `Complaints.tsx`, `Dashboard.tsx`, `index.css`, `package.json`.

### Models (built in code from boxes, cylinders, tori and extruded SVG shapes)

Matte materials in brand colours: blue `#1E40AF`, yellow `#FACC15`, ink `#101828`, building grey `#e4e7ec`, red `#b42318`, window tint `#dbe4ff`. One hemisphere light plus one directional light with soft shadows.

- **Street** (anchor: the scene stage, native units follow the old 800×300 SVG, ground at y = 0): a slab 2400 wide with a blue front face, sidewalk, curb and road with yellow dashes; the house (box, extruded roof, door); the clinic (box, roof band, red cross, door that turns grey with a white X when the appointment is missed); the rider in a wheelchair on the sidewalk; a clock post; the van (body extruded from the SVG van profile, windows, yellow stripe, wheelchair decal, wheels that roll); a calendar with a red X. Pop-up pieces hinge on their back bottom edge.
- **Clock**: white face, ink rim and ticks, ink hour hand, blue minute hand.
- **Phone**: extruded rounded body, screen plane with a canvas texture that redraws the home screen preview (greeting, two buttons, three ride rows with chips). Casts a shadow onto a shadow-only plane behind it.
- **Step icons**: clipboard with a check, a letter with a folded corner and lines, a bar chart with three bars. Each has a shadow-only plane behind it.

### Scroll mapping (`story.ts`)

- `trackProgress(rect, viewportH)`: the pinned street's progress `p` (existing formula).
- `viewProgress(rect, viewportH)`: 0 when an element's top meets the viewport bottom, 1 when its bottom leaves the top.
- `street(p)`: `rise` 0→1 over p 0–0.15; `vanIn` over 0.3–0.6; `vanPast` over 0.6–0.85; `verdict` over 0.85–1; `missed` at p ≥ 0.85; `tilt` 24° → 16° (as pieces rise) → 6° (verdict); `orbit` −16° → +16°; caption phase. Both the CSS fallback and the 3D street use it, so they tell the same story.
- `clockAngles(p)`: minute hand 0° → 120°, hour hand 270° → 280° (9:00 → 9:20). The SVG fallback clock uses the same values.
- `flight(scrollY, trackTop)`: 0 at the top of the page, 1 when the street pins; smoothstepped.

The clock reads 9:00 in the hero and during the flight, then runs to 9:20 across the street story.

### Motion per model

- Street: pieces stand up (rise), the set tilts and swings (tilt, orbit), the van drives at `x` −1300 → −56 (beside the rider) → +1300 with wheels rolling, the calendar rises from behind the clinic and comes forward to face the viewer.
- Clock: position, rotation and scale blend from the hero slot to the post on the street (`flight`).
- Phone: rotation follows the old CSS keyframes (`rotateY` −38° → −12° → 16°, `rotateX` 18° → 5° → −6°) over `viewProgress`.
- Step icons: turn from edge-on to a three-quarter rest pose; chart bars grow; driven by their card's `viewProgress`, staggered like the cards.

### Reduced motion

3D stays, motion stops. Models sit in a still pose (street at p = 0.6, phone at its rest angle, icons at rest, bars full). A second, static clock stays on the street post and the hero clock stays in the hero. CSS scroll animations and the app's tap and screen animations are off; press states change colour and edge instantly.

### Accessibility

- The canvas is `aria-hidden` and ignores pointer events. Anchor slots keep their descriptions (`role="img"` + `aria-label` on the street stage and the phone; the hero clock and step icons are decorative and stay `aria-hidden`).
- Fallback visuals are hidden with `opacity: 0` / `visibility: hidden` on decorative children only, never on an element that carries the accessible name.
- No control changes size; all stay at least 44 px with their focus rings. Nothing covers a focusable element.

### Performance budget

- Device pixel ratio capped at 2. Shadow map 2048 on wide screens, 1024 on narrow ones.
- Expect roughly 80 draw calls; render only on change.
- The `three` chunk is reported from the build output and must not appear in the main chunk.

## Testing

- `node tests/story.test.ts`: boundaries of every phase, clamping, van off screen at both ends, clock at 9:00 and 9:20, flight 0 and 1.
- `npm run build` and `npm run lint`.
- Screenshots (desktop 1440×900 and phone 390×844) at the top, hero leaving, five street phases, phone, steps, stats, FAQ, band, footer.
- Runs with reduced motion and with WebGL disabled (fallback must show).
- axe-core on the landing page and each app screen; a keyboard-only pass.
