# Lovable UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all six screens from PR #7's Lovable project into `frontend/` on our plain React + Vite stack, plus the one backend field the new Home screen needs.

**Architecture:** Copy the Lovable component files out of `origin/lovable-update` into `frontend/src/`, then replace the four things our stack lacks (`@/` alias, shadcn `Button`, TanStack `Link`, and add `lucide-react`). Landing and the app switch on `location.hash` in `main.tsx`. `GET /api/trips` gains a `filing` field.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind v4, oxlint; FastAPI, uv, pytest.

**Spec:** `docs/superpowers/specs/2026-11-13-lovable-ui-migration-design.md`

## Global Constraints

- Source for every ported file is `origin/lovable-update` (head `5a4b795`). Run `git fetch origin lovable-update` first. Do not merge or rebase that branch.
- `SRC=origin/lovable-update:frontend-lovable/src` in the commands below.
- Extract files with `git show "$SRC/<path>" | tr -d '\r' > <dest>` so line endings stay LF like the rest of `frontend/src`.
- The only new dependency is `lucide-react`. Do not add TanStack, Radix, cva, clsx, tailwind-merge, React Query, Playwright or axe.
- Do not copy anything from `frontend-lovable/` other than the files named here, and nothing from the PR's `.claude/` or `frontend/.agents/`.
- Run `npm install` from Windows (PowerShell or Git Bash), never WSL: `node_modules` holds Windows-native binaries.
- Filing deadlines use `clock.today()` (Michigan time), never `date.today()`.
- No on-screen statistic without a source. Patterns keeps its "synthetic" label.
- Commit only if the person running the plan has asked for commits; the commit steps name the files either way.

## Review Focus

1. Reloading or deep-linking `…/#app` opens the app, not Landing; browser Back from the app returns to Landing. (Task 3, Step 4)
2. A problem ride whose provider has an unverified channel with no deadline: `filing.days_left` is `null` and Home shows no "days left" line rather than "null days". (Task 1 test; Task 4 browser check)
3. Backend unreachable: Home shows "Could not load your rides", never "No rides logged yet". (Task 4)
4. Keyboard only: skip link works and changing tabs moves focus to the `h1`, now that tabs are plain buttons. (Task 4)
5. Google Fonts blocked or offline: text still renders in the fallback stack with no layout break. (Task 4)

---

### Task 1: `filing` on `GET /api/trips`

**Files:**
- Modify: `backend/app/main.py` (`list_trips`, around line 110)
- Test: `backend/tests/test_api.py`

**Interfaces:**
- Consumes: `seed.provider(id)`, `seed.channel(id)`, `complaints.days_left(channel, trips, today)`, `clock.today()`, test helpers `history(client)` and `post_trip(client, **fields)`.
- Produces: each trip from `GET /api/trips` has `filing: {office: str, deadline_days: int | None, days_left: int | None} | None`.

- [ ] **Step 1: Write the failing tests** in `backend/tests/test_api.py`, after `test_log_trip_then_see_it_in_history`:

```python
def test_history_says_where_a_problem_ride_would_be_filed_and_by_when(client):
    filing = {t["incident_type"]: t["filing"] for t in history(client)}
    assert filing[None] is None  # a fine ride has nothing to file
    assert filing["no_show"] == {
        "office": "DDOT ADA Coordinator, Compliance Division",
        "deadline_days": 180,
        "days_left": 162,  # seeded 18 days ago
    }


def test_history_has_no_days_left_for_an_unverified_channel(client):
    post_trip(client, rider_id="r2", provider_id="modivcare-mi", incident_type="no_show")
    (trip,) = history(client, rider_id="r2")
    assert trip["filing"]["days_left"] is None
```

If the seeded demo no-show is not 18 days old on our branch (see `main.py` around line 53–68), change `162` to `180 - <its days_ago>`; do not change the seed.

- [ ] **Step 2: Run to verify they fail**

Run (from `backend/`): `uv run pytest tests/test_api.py -k history -v`
Expected: both new tests FAIL with `KeyError: 'filing'`.

- [ ] **Step 3: Implement** `_filing(trip: dict, today: date) -> dict | None` in `backend/app/main.py` and have `list_trips` return `[{**t, "filing": _filing(t, today)} for t in store.by_rider(rider_id)]` with `today = clock.today()`. `_filing` returns `None` for a fine ride or a provider with no complaint channel; otherwise `office` is the channel's `name`, `deadline_days` is `channel.get("deadline_days")`, `days_left` is `complaints.days_left(channel, [trip], today)`. Reference: `git diff d6a58a4 origin/lovable-update -- backend/app/main.py`. Add `date` to the `datetime` import.

- [ ] **Step 4: Run the whole backend suite**

Run: `uv run pytest`
Expected: all pass.

- [ ] **Step 5: Commit** `backend/app/main.py backend/tests/test_api.py` — "Tell the rider where a problem ride would be filed and by when".

---

### Task 2: App shell, five screens, styles

**Files:**
- Replace from `$SRC/components/riderecord/`: `frontend/src/App.tsx`, `Complaints.tsx`, `Dashboard.tsx`, `TripForm.tsx`, `VoiceLog.tsx`, `ui.tsx`, `api.ts`
- Create from the same place: `frontend/src/Home.tsx`
- Replace: `frontend/src/index.css` from `$SRC/styles.css`
- Modify: `frontend/package.json`, `frontend/package-lock.json`, `frontend/index.html`
- Create: `docs/design-system.md` from `origin/lovable-update:docs/design-system.md`

**Interfaces:**
- Consumes: `Trip.filing` from Task 1 (already typed in the Lovable `api.ts`).
- Produces: `App` default export unchanged; in-app links to Landing are `<a href="#">`. Task 3 relies on that href.

- [ ] **Step 1: Copy the files** with the `git show … | tr -d '\r' >` form from Global Constraints. Then `git diff --stat frontend/src` should show changes of roughly the size in the PR (tens to low hundreds of lines per file), not whole-file rewrites of unchanged content; if a file shows as fully rewritten, its line endings are wrong.

- [ ] **Step 2: Install the one dependency**

Run (from `frontend/`, Windows shell): `npm install lucide-react`

- [ ] **Step 3: Replace the foreign pieces** in `frontend/src/*.tsx`:
  - Every `from '@/components/riderecord/X'` → `from './X'`.
  - `App.tsx`: delete the `Link` and `Button` imports. Both `<Link to="/" …>` → `<a href="#" …>` with the same children and classes. The nav `<Button variant="ghost" …>` → `<button …>` with `className="rr-tab"`.
  - `Home.tsx`: delete the `Button` import. Both `<Button …>` → `<button …>`; drop the `variant` prop; prefix each `className` with `inline-flex items-center gap-2 [&_svg]:size-4 ` (what shadcn's base supplied), and add `border ` to the second one (what `variant="outline"` supplied).
  - `index.css`, the `.rr-navigation .rr-tab` rule: add `display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.5rem 1rem; cursor: pointer;`.

- [ ] **Step 4: Fonts.** In `frontend/index.html` `<head>`, add the two `preconnect` links and the stylesheet link `https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@500;600;700&display=swap` (see `$SRC/routes/__root.tsx` lines 93–99; `crossorigin` on the gstatic preconnect). Leave title, description and theme-color alone.

- [ ] **Step 5: Verify nothing foreign is left**

Run: `grep -rnE "@/|@tanstack|components/ui/button|lovable" frontend/src`
Expected: no output.

- [ ] **Step 6: Build and lint**

Run (from `frontend/`): `npm run build` then `npm run lint`
Expected: both exit 0. If Tailwind classes are missing from the built CSS, change line 1–2 of `index.css` back to the single line `@import 'tailwindcss';` and rebuild.

- [ ] **Step 7: Commit** `frontend/src frontend/package.json frontend/package-lock.json frontend/index.html docs/design-system.md` — "Port the Lovable app shell and screens onto plain React".

---

### Task 3: Landing and the hash switch

**Files:**
- Create: `frontend/src/Landing.tsx` from `$SRC/components/riderecord/Landing.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `App` (default export) and its `<a href="#">` links from Task 2.
- Produces: `…/` shows Landing; `…/#app` shows the app.

- [ ] **Step 1: Copy `Landing.tsx`** (same `git show … | tr -d '\r' >` form).

- [ ] **Step 2: Replace the router links.** Delete the `Link` import; all four `<Link to="/app" …>` → `<a href="#app" …>`. Leave the existing `href="#top"` anchors alone.

- [ ] **Step 3: Switch on the hash** in `main.tsx`: a small `Root` component that renders `<App />` when `location.hash === '#app'` and `<Landing />` otherwise, re-rendering on the window `hashchange` event (`useSyncExternalStore` or `useState` + `useEffect`, cleaning up the listener). On switching, scroll to top. Add one comment line: `// Hash, not a path: the backend serves static files with no fallback for /app.`

Note: Landing's own `#top` links also fire `hashchange`; they must keep showing Landing, which the `=== '#app'` test already gives.

- [ ] **Step 4: Verify in the browser**

Run (from `frontend/`): `npm run build`, `npm run lint`, then `npm run dev` with the backend up (`uv run uvicorn app.main:app --reload` from `backend/`).
Expected: `/` shows Landing; each of the four calls to action opens the app; reloading on `#app` stays in the app; Back returns to Landing; the app's logo and "About RideRecord" return to Landing; "Back to top" on Landing stays on Landing.

- [ ] **Step 5: Commit** `frontend/src/Landing.tsx frontend/src/main.tsx` — "Add the landing page and switch to the app on #app".

---

### Task 4: Whole-app check and copy audit

**Files:** none expected; fixes go to the file at fault.

- [ ] **Step 1: Walk all five tabs** against the live backend: Home lists recent rides with status chips and, for the seeded DDOT no-show, "Goes to … — N days left to file"; Log saves a ride that then appears on Home; Talk shows its recorder; Complaints drafts; Patterns shows the table and still says the data is synthetic.
- [ ] **Step 2: Review Focus 2.** Log a no-show for the Modivcare provider; its Home row shows no "days left" line and no "null".
- [ ] **Step 3: Review Focus 3.** Stop the backend, reload `#app`: Home shows "Could not load your rides", not "No rides logged yet".
- [ ] **Step 4: Review Focus 4.** Keyboard only: Tab reaches "Skip to content" first and it jumps to main; activating a tab moves focus to the `h1`; every control shows a visible focus ring.
- [ ] **Step 5: Review Focus 5.** Block `fonts.googleapis.com` in devtools and reload: text is readable, nothing overlaps.
- [ ] **Step 6: Narrow screen.** At 375px wide the bottom tab bar shows all five tabs with icon over label and nothing scrolls sideways, on both Landing and the app.
- [ ] **Step 7: Read Landing's copy line by line.** List every number, deadline, legal claim or claim about what the product does. Each must trace to `seed_data.json`, a cited source, or a working feature. Report anything that does not to the team; do not ship it and do not rewrite it into a new unsourced claim.
- [ ] **Step 8: Final gate.** `npm run build`, `npm run lint` in `frontend/`; `uv run pytest` in `backend/`. All exit 0.
