# 3D everything: design

Date: 2026-11-14. Branch: `lovable-ui-migration`. Extends `2026-11-14-3d-everywhere-design.md` (three.js street, clock, phone, icons; CSS 3D sections; calm app).

## Intent

Every component, button, number and piece of text on RideRecord has depth, and every click feels physical. Approved by the user: "everything".

## Design

### 1. Real 3D letters on the landing page (three.js)

- Elements marked `data-3d-text` become extruded letter geometry in the existing WebGL layer: the hero headline (`hero`), every section heading (`heading`), and the three stat numbers (`number`).
- The browser still lays out the real HTML element. `type3d.ts` measures its line boxes with DOM ranges (per text node, so the muted "never came." keeps its colour), builds one mesh per line run, and scales each run to the measured width. Wrapping, `text-wrap: balance` and phone widths come from the browser.
- Font: Space Grotesk Bold (OFL), converted once to three.js's typeface JSON with opentype.js in a scratch script, limited to the characters the page uses (printable ASCII plus curly quotes and dashes). Shipped as `frontend/public/fonts/space-grotesk-bold.typeface.json` with `OFL.txt` beside it. No runtime library, no CDN.
- Front faces in the text colour, sides in brand blue (light sides for light text), lit by the existing sun.
- Motion: the hero headline folds back as the page scrolls; each heading tips up from lying back as it enters; numbers make a half-turn into place, staggered.
- When the letters are ready the world sets `data-type="on"` on the landing root; CSS then hides the HTML text (`opacity: 0`, still read by screen readers) and turns off the CSS transforms on those headings and their containers (moving the CSS motion to the sibling text instead), so measurement is never distorted.

### 2. Solid type everywhere else (CSS)

- Card titles, button labels, captions, FAQ questions, the app's titles, legends and numbers: extruded with stacked `text-shadow` layers toward the bottom right (same light as the 3D scene).
- Body text: a subtle 1px raised edge. Contrast unchanged.
- Without WebGL, headings and numbers use the same CSS extrusion, deeper.

### 3. Every component is a physical slab

- Landing: step cards, stat tiles, FAQ items (now separate raised tiles), CTA keys, the closing band (bevelled edges).
- App: buttons and keys (existing), answer tiles, records, chips and status messages (edge), fields (sunken), the deadline bar (groove), panels (`.slab`: the demo-data notice, the voice confirm box), logo tile and avatar.
- Lift and press use the `translate` property and tilt uses the `rotate` property, so they compose with the `transform` animations already in place.

### 4. Pointer tilt and press

- `tilt.ts`, started once from `main.tsx`: one delegated `pointermove` listener tilts the hovered component toward the mouse (max 7°) by setting its `rotate` property; containers get `perspective`. Only for mouse input on hover-capable fine pointers, never with reduced motion. Keeps the current element while the pointer is inside its untilted box, so edges never flicker. Resets on scroll, pointer exit and blur.
- Tilt targets: landing step cards, stat tiles, FAQ items, CTAs, logo; app buttons, keys, answer tiles, records, tabs. Not fields.
- Everything clickable sinks on `:active` and springs back.

### Accessibility and fallbacks

- HTML headings stay in the DOM and the accessibility tree; only hidden visually once the 3D letters exist. No WebGL or a failed font load leaves them visible with CSS depth.
- Reduced motion: depth stays; no tilt, no spin, no fold, no press travel.
- axe on every screen, keyboard pass, desktop and phone screenshots.

### Testing

- `tests/lines.test.ts`: grouping measured word boxes into line runs.
- `tests/tilt.test.ts`: tilt axis and angle from pointer position (centre, corners, outside).
- Existing `tests/story.test.ts` stays green.
