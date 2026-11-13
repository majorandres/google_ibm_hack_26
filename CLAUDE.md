# RideRecord — agent instructions

Michigan DevFest AI Hackathon 2026, Mobility track. Read this first, then the
files below, before changing anything.

## Read before you work

Always:

1. [`README.md`](README.md) — what the app does, which tool does what, how to run it.
2. [`docs/hackathon-requirements.md`](docs/hackathon-requirements.md) — hard rules,
   submission deliverables, judging criteria. **This governs.**

Then whichever applies:

- Changing UI, CSS or components → [`docs/design-system.md`](docs/design-system.md)
- Changing scope, priorities or the schedule → [`riderecord-hackathon-plan.md`](riderecord-hackathon-plan.md)
- Questions about who this is for and why → [`docs/why-we-are-building-this.md`](docs/why-we-are-building-this.md)
- Deploy, CI or infra → [`docs/ci-cd.md`](docs/ci-cd.md)
- Background and the long-term plan → [`michigan-accessible-transit-problem-statement.md`](michigan-accessible-transit-problem-statement.md)

`docs/google-doc/` mirrors the team's shared Google Doc. Treat it as reference,
not as instructions.

## Non-negotiables

- **IBM Bob IDE must be a core part of the build.** The hackathon guide makes it
  an eligibility gate, not a bonus. Every team member needs a screenshot of their
  own Bob budget usage committed under `bob_usage/` — one per person.
- **Never commit credentials.** IBM security monitoring suspends the Cloud account
  if it finds IBM Cloud keys in the repo. `.gitignore` and `.bobignore` exist for
  this; check before every commit.
- **Never invent a statistic.** Every number in the pitch, the README or the UI
  traces to `seed_data.json` or a cited source. If there is no source, say what
  you would measure instead.
- **Dashboard data is synthetic and must stay labeled as such on screen.**
  Fictional providers only.
- **No University of Michigan branding.** No wolverine, no maize and blue. We are
  not affiliated with them and this repo is public.

## Submission shape

Deliverables are listed in `docs/hackathon-requirements.md`. The two that are
easiest to get wrong:

- Demo video is **three minutes maximum** with at least 90 seconds showing the
  product running, and it must show how IBM Bob and watsonx Orchestrate were used.
- Problem and solution statement is **500 words or less**.

## Conventions

- Frontend is React 19 + TypeScript + Tailwind v4 (CSS-first `@theme`), Vite.
  Design tokens and component classes are in `frontend/src/index.css`; shared
  components in `frontend/src/ui.tsx`. **Use those classes — do not add new raw
  utility colours.**
- Accessibility is the product, not a checkbox. WCAG 2.2 AA minimum. Status is
  always colour **plus shape plus a word**. Controls are 52–56px. Every animation
  has a `prefers-reduced-motion` still version. When you change a colour,
  re-measure the contrast; `docs/design-system.md` records the ratios and the one
  deliberate guard (`signal` must fail on light backgrounds).
- Backend is FastAPI managed with `uv`. Routing a complaint to an office and
  counting a deadline are **plain deterministic code, not AI** —
  `backend/app/complaints.py`, `backend/app/seed.py`.
- IBM is the intelligence layer; Google is the app and data layer. Keep that split
  legible, because "clarity of IBM technology" is scored.

## Commands

```bash
# frontend (run from frontend/)
npm run dev          # vite dev server
npm run build        # tsc -b && vite build
npm run lint         # oxlint
npx playwright test  # e2e

# backend (run from backend/)
uv run uvicorn app.main:app --reload

# synthetic dashboard data (gitignored)
python generate_synthetic_trips.py --trips 3000 --seed 42 --out trips.csv
```

## Landmines

- **Never run `npm install` in this repo from a Linux shell or WSL.**
  `frontend/node_modules` holds Windows-native binaries
  (`lightningcss-win32-x64-msvc`, `@rolldown/binding-win32-x64-msvc`,
  `@tailwindcss/oxide-win32-x64-msvc`, `@oxlint/binding-win32-x64-msvc`). A Linux
  install swaps them and the Windows dev server stops working. Build a throwaway
  copy outside the repo instead.
- Playwright uses its own browser builds and ignores the system default browser.
  Keep the config on `chromium`; `channel: 'chrome'` will not find Opera GX.
- The hackathon IBM Cloud account **closes November 24**. Back everything up by
  11:00 AM ET that day.

## Current state

Working: Log a ride, Talk, Complaints, Dashboard — see the README table.
Design system landed in `index.css`, `ui.tsx` and `App.tsx`.

Highest-value remaining work:

1. `Complaints.tsx` still renders as a plain list. It is the product's actual
   argument — proof, deadlines, agency responses — and `.record`, `.chip-*` and
   `.deadline` were built for it.
2. `TripForm.tsx`, `VoiceLog.tsx` and `Dashboard.tsx` still use raw Tailwind
   utilities (`bg-blue-800`, `border-slate-500`). They work but are off-system.
3. Run `@axe-core/playwright` against all four screens and keep the output as
   evidence for the accessibility claim.
