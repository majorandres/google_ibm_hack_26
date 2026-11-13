# Lovable UI migration: design

Date: 2026-11-13. Source: PR #7 (`origin/lovable-update`, head `5a4b795`). Target branch: `stt-demo-fixes` or a branch cut from it.

## Intent

Bring the new look from PR #7 into the real app in `frontend/`, for every page that has a working feature behind it, without adopting the Lovable project's framework.

## Scope

In:

| Page | Backed by | Work |
|---|---|---|
| Log a ride (`TripForm`) | `POST /api/trips` | restyle |
| Talk (`VoiceLog`) | `/api/voice`, `/api/extract` | restyle |
| Complaints | `/api/complaints` | restyle |
| Patterns (`Dashboard`) | `/api/stats` | restyle |
| Home (new) | `GET /api/trips` + new `filing` field | new page + backend change |
| Landing (new) | none, static | new page |

Out (non-goals):

- `frontend-lovable/` itself, and everything under `.claude/` and `frontend/.agents/` in the PR (agent skills, a Windows `.exe`).
- TanStack Start / Router, React Query, shadcn, Radix, cva, clsx, tailwind-merge, the `@/` alias, Lovable error reporting.
- The PR's `frontend/e2e/example.spec.ts` (Playwright's stock sample, tests playwright.dev) and its Playwright/axe dev dependencies.
- Merging PR #7 as a whole. It is based on an old `main`; we take files from it, not its history.

Anti-goals: an on-screen statistic with no source; losing the "synthetic data" label on Patterns; any regression in keyboard focus, skip link, or control size.

## Approaches considered

- **A. Port files and swap the four foreign pieces. Chosen.** One new dependency, our stack unchanged. Costs a few dozen hand edits.
- **B. Add Lovable's dependencies so files copy verbatim.** Six or more dependencies and a router for two screens. Only pays off if we re-import from Lovable repeatedly; this is a one-time import.
- **C. Make `frontend-lovable` the app.** Server-rendered TanStack Start changes the build and the Cloud Run deploy. Rejected.

## Design

### Frontend (`frontend/src`)

Source of truth for each file is the Lovable copy at `origin/lovable-update:frontend-lovable/src/components/riderecord/`. `frontend/src` has not changed on our branch since the PR's base, so nothing of ours is overwritten.

1. Copy `App.tsx`, `Complaints.tsx`, `Dashboard.tsx`, `TripForm.tsx`, `VoiceLog.tsx`, `ui.tsx`, `api.ts`, `Home.tsx`, `Landing.tsx` into `frontend/src/`.
2. Copy `frontend-lovable/src/styles.css` over `frontend/src/index.css`. Keep line 1–2 (`@import "tailwindcss" source(none); @source "../src";`) only if the build picks up classes; otherwise restore our current first line.
3. Swap the foreign pieces:
   - `@/components/riderecord/X` → `./X` (all files).
   - `Button` from `@/components/ui/button` (3 uses: nav tabs in `App.tsx`, two calls to action in `Home.tsx`) → plain `<button type="button">` keeping the same `className`. The shadcn base classes that matter (inline-flex, centring, gap, icon size) move into the `.rr-tab` rule and the two Home class strings.
   - `Link` from `@tanstack/react-router` (6 uses) → `<a href="#app">` for `to="/app"`, `<a href="#">` for `to="/"`.
   - `lucide-react` → add to `frontend/package.json` dependencies. The only new dependency.
4. Landing/app switch in `main.tsx`: render `<App />` when `location.hash === '#app'`, else `<Landing />`, re-rendering on `hashchange`. Hash, not a path, because the backend serves the build with `StaticFiles(html=True)`, which has no fallback for `/app`.
5. `index.html`: add the Google Fonts links for Inter and Space Grotesk that Lovable set in `__root.tsx`. Keep our title and description.
6. Type nits: Lovable's `x?: T | undefined` props work as-is; leave them.

### Backend

`GET /api/trips` adds `filing` to each trip: `{office, deadline_days, days_left}` for a problem ride with a known complaint channel, else `null`. Take `_filing` from the PR's `backend/app/main.py`, but use our existing Michigan-time `today()` helper instead of the PR's `date.today()`. Take the PR's test `test_history_says_where_a_problem_ride_would_be_filed_and_by_when`.

### Docs

Take `docs/design-system.md` from the PR. Take the PR's `CLAUDE.md` only if the team wants it; it describes the pre-Lovable state and would need its "Current state" section updated. Default: leave it out.

## Checks before it is done

- `npm run build` and `npm run lint` pass in `frontend/`; `uv run pytest` passes in `backend/`.
- In the browser: Landing loads at `/`, every call to action reaches the app, the logo returns to Landing, all five tabs render against the live backend, Home shows recent rides with "days left to file".
- Keyboard only: skip link works, tab change moves focus to the heading.
- Landing copy read line by line against the "never invent a statistic" rule; anything unsourced is flagged to the team, not shipped.
- Patterns still says the data is synthetic.

## Left to the builder

- Exact base classes to fold in when replacing `Button`.
- Whether any CSS in `styles.css` is dead after the swap (remove only if obviously unused).
- The new backend test depends on a seeded no-show 18 days old and a `history` helper; adapt to our current fixtures if they differ.
