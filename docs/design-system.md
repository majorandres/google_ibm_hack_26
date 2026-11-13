# RideRecord design system

Tokens and component classes live in `frontend/src/index.css` (Tailwind v4 `@theme`).
Shared components live in `frontend/src/ui.tsx`.

## The idea

RideRecord is a **record-keeping tool for advocacy**. The visual language is
documentary, not playful: hairline rules instead of drop shadows, monospace for
anything that is data (case references, dates, route codes), squared-off corners
because a record is a document rather than a bubble.

Users are riders with disabilities and their caregivers. Everything is sized for
one thumb on a phone at a bus stop.

## Palette — Great Lakes blue and limestone

| Token | Hex | Use |
|---|---|---|
| `limestone` | `#faf8f4` | page background (warm, not sterile) |
| `paper` | `#ffffff` | raised records |
| `line` / `line-strong` | `#d5cdc0` / `#938778` | hairlines / field borders |
| `ink` | `#0a1a24` | body text |
| `deep` | `#103a55` | record spine, deadline rule |
| `lake` | `#15577e` | primary action |
| `lake-dark` | `#0f4160` | hover/active |
| `tint` | `#deebf3` | selected fill |
| `signal` | `#f3c074` | **only on ink or lake** |
| `rust` | `#8f3a10` | warm accent for text on light |
| `filed` / `overdue` / `pending` | `#15614a` / `#99202a` / `#6e5210` | status |

**No wolverine, no maize and blue.** That is the University of Michigan's
identity and we are not affiliated with them. The Michigan feel comes from the
lakes and the shoreline instead.

## Contrast — measured, not assumed

Every pairing was computed against WCAG 2.2 AA. Two values were changed because
they failed:

- `line-strong` was `#b4a898` → 2.33:1 against paper. Non-text UI borders need
  3:1 (SC 1.4.11). Now `#938778` → 3.51:1.
- `signal` was `#e8a33d` → 3.61:1 on lake, which fails for text. Now `#f3c074`
  → 4.67:1 on lake and 10.63:1 on ink.

Verified ratios: ink on limestone 16.69, lake on limestone 7.34, white on lake
7.79, muted `#5a5146` on limestone 7.33, filed 7.39, overdue 8.09, pending 7.30.

`signal` on limestone is **1.57:1 and must never be used as text on a light
surface.** That guard is deliberate — if you move it, re-measure.

## Type

IBM Plex Sans and IBM Plex Mono, loaded with `local()` first and `font-display:
swap`, so an offline demo degrades to the system stack rather than breaking.
Plex is open source and quietly signals the IBM stack without a logo.

Body floor is 17px. Headings use `clamp()` with negative tracking.
`time`, `code` and `[data-mono]` get tabular figures automatically.

## Components

- `.btn` + `.btn-primary` / `.btn-secondary` — 56px tall. The brief said 48
  minimum; these users are often one-handed.
- `.field`, `.label`, `.hint` — 52px, 2px borders.
- `.choice` — big tappable radio/checkbox; the real input stays for screen
  readers.
- `.record` / `.record-head` / `.record-id` / `.record-body` — **the signature
  component.** A filed document: left spine, hairline rule, monospace reference.
- `.chip` + `.chip-filed` / `.chip-pending` / `.chip-overdue` — status is
  **colour + distinct shape + the word**, never colour alone. Circle, triangle,
  hexagon.
- `.deadline` — time until the agency's response deadline as a rule, not a
  number. Set `--pct` inline; put the accessible name on the parent.
- `.tabbar` / `.tab` — thumb-reachable bottom nav, labels always visible.
- `.built-with` — the quiet IBM credit line.

## Motion

Every animation has a still version. `prefers-reduced-motion: reduce` zeroes all
transitions and the button press. `forced-colors: active` is honoured rather
than fought.

## Still to do

1. `TripForm.tsx`, `VoiceLog.tsx`, `Complaints.tsx`, `Dashboard.tsx` still use
   raw Tailwind utilities (`bg-blue-800`, `border-slate-500`). They work, but
   they are off-system. Port them to the classes above.
2. `Complaints.tsx` is where `.record`, `.chip-*` and `.deadline` belong — that
   screen is the product's argument and currently looks like a list.
3. Run `@axe-core/playwright` against all four screens and keep the output; it
   is evidence for the accessibility claim rather than an assertion.
4. The "How did it go?" grid orphans its ninth option. Either make it a single
   column or add a tenth.

## Landmines

- **Never run `npm install` in this repo from a Linux shell.** `node_modules`
  holds Windows-native binaries (`lightningcss-win32-x64-msvc`,
  `@rolldown/binding-win32-x64-msvc`, `@tailwindcss/oxide-win32-x64-msvc`,
  `@oxlint/binding-win32-x64-msvc`). A Linux install swaps them and the Windows
  dev server stops working.
- Playwright ignores your default browser and uses its own builds. Keep the
  config on `chromium`; `channel: 'chrome'` will not find Opera GX.
