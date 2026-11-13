# Pre-build review

Written by Bob (Claude) at approximately 12:45 PM ET on November 13, 2026 — about 5 hours before the submission deadline.

**State of the repo when this was written:** research done, business canvas done, screen mockup done, backend and frontend scaffolded (`/api/health` and `/api/granite/ask` exist), Terraform and deploy script in place. No product features built yet. Confirmed: `ibm/granite-4-h-small` is the only Granite chat model available on the hackathon account; the stack is IBM Code Engine + FastAPI + React/Vite, with Google transit routing as the one unconfirmed Google component.

---

## 1. Gut check

**Strong idea for this track.** The evidence base is unusually solid for a hackathon — primary sources, recent dates, specific numbers that survive a follow-up question. The "verdict, not a trip plan" framing is genuinely differentiated from Google Maps and the Transit app. The Wayne County millage vote (67% yes, August 4, 2026) gives the pitch a dated *why now* that most hackathon ideas lack. The employer-view angle turns a consumer tool into a B2B story, which strengthens the Michigan-impact criterion.

**Biggest weakness: the late-night Google Routes API call has not been tested.** The entire demo scenario — a worker leaving Warren at 11:30 PM — depends on the Routes API returning DDOT/SMART itineraries for that hour. Nobody has run that query. If it returns nothing, the core demo flow breaks. That is the single existential risk. Everything else is manageable.

**Secondary concern:** the scaffold moved from Google Cloud Run to IBM Code Engine after the tech-resources doc was written. That is the right call for the judging criterion (IBM clearly applied), but it adds one more unverified step — the first run of `scripts/deploy.sh` has not been executed, so it is not yet known whether the team's Viewer-only role on the resource group will block the Container Registry namespace creation.

---

## 2. Score against each judging criterion

| # | Criterion | Score | Reasoning |
|---|---|---|---|
| 1 | **Completeness & feasibility / IBM clearly applied** | 3 / 5 | The scaffold is wired to `ibm/granite-4-h-small` and the deploy path exists; but no product feature is built yet and Granite's role in the actual verdict is undefined — judges score visible IBM decisions, not a smoke-test endpoint. |
| 2 | **Creativity & innovation** | 4 / 5 | Round-trip shift verdict with a risk score is a real gap; the "decision, not a navigation" framing is fresh; the employer view flips the user model. |
| 3 | **Design & usability** | 4 / 5 | The existing mockup is clean and the three-state verdict (yes / risky / no) is immediately scannable; the actual frontend is a placeholder today. |
| 4 | **Effectiveness & efficiency** | 3 / 5 | A schedule-based risk score is honest and defensible, but without a confirmed late-night Routes call the demo depends on canned data, and the score's factors are not yet implemented. |
| 5 | **Michigan impact** | 5 / 5 | 21 % carless Detroit households, 70 % of employed Detroiters working outside the city, transportation as the top workforce barrier in all 16 Michigan Works! regions — the evidence is direct and the Wayne County vote gives it a current hook. |

**Lowest scores are 1 and 4.** Both are fixed by the same two things: a confirmed live Routes call, and Granite producing a visible, quoted sentence in the UI.

**One concrete change that raises both:** define Granite's exact prompt and show its plain-English explanation as a named element on the verdict screen, next to the risk score. When a judge asks "where does IBM come in?" the answer is on the screen, not in the architecture diagram.

---

## 3. IBM Granite's role

The judges score "how clearly IBM technology is applied." `ibm/granite-4-h-small` must produce a **visible, quoted output on-screen** — not reword an error message, not label a verdict badge that plain code already computed.

### Recommended: risk-score explainer (one API call)

**Input** — structured JSON passed as the user message:

```json
{
  "shift_end": "23:30",
  "last_bus_home": "23:47",
  "margin_minutes": 17,
  "transfers": 2,
  "agency_ontime_rate": 0.68,
  "headway_minutes": 70,
  "verdict": "risky"
}
```

**Output** — 2–3 sentences, e.g.:

> *"The trip home is risky because your shift ends at 11:30 PM and the last SMART Route 560 leaves at 11:47 PM — only 17 minutes of margin. SMART runs on time 68% of the time, so a delayed clock-out can mean a 70-minute wait for the next bus. Consider asking for the 10:30 PM shift, or check whether the MichiVan vanpool covers this route."*

**Why an LLM and not plain code:** the *sentence construction* is the product. The right risk factor to lead with changes — sometimes it is the last-bus gap, sometimes it is transfer count, sometimes it is headway. That variable-priority narrative is exactly what a small instruction-following model handles better than a branching template, and it produces a quotable human sentence that a verdict badge does not.

**What to skip:** a Granite-powered backup-plan selector (Option B from the review session). A backend filter over the SMART Flex / MichiVan data is faster and more reliable. Keep Granite on the one job it does well.

---

## 4. Scope for the remaining ~5 hours

Three people building in parallel. Finished beats fancy.

### MUST — demo fails without these

- Address + shift input form (origin, destination, shift start, shift end, work days)
- Google Routes API: two calls per check — *arrive by* shift start, *depart after* shift end
- Risk score function (pure Python): last-bus gap in minutes, transfer count, agency on-time rate → verdict string (`yes` / `risky` / `no`)
- Granite call: one `chat()` call with the risk score JSON → plain-English explanation string
- Verdict screen: badge + Granite sentence visible in the UI
- Sample-data fallback if the late-night Routes call returns nothing (3 canned route objects: one yes, one risky, one no)
- Deployed: `scripts/deploy.sh` succeeds and the app is reachable at a public URL

### NICE — adds score, demo works without

- Backup plan panel (SMART Flex / MichiVan info cards, shown on risky/no verdict)
- Employer view: "X of Y car-less applicants can reach this shift"
- "What if the shift ended 30 min earlier?" recalculation

### CUT

- Any live booking flows (ruled out)
- Weather or walk-safety overlays (NWS / crash data)
- Multi-city support (mention in pitch as future state)
- Authentication or data persistence (stateless API is enough)
- Supabase (no database needed)
- watsonx Orchestrate (confirmed: not needed for a single Granite call)
- Granite Guardian (not provisioned on the hackathon account)

---

## 5. Biggest technical risks

### Risk 1 — Late-night Google Routes API (critical — test first, right now)

The demo scenario is a 11:30 PM departure from Warren. The Routes API has not been called for that time or for DDOT/SMART. If it returns no transit itinerary, the core scenario has no data.

**Fastest fallback:** parse the DDOT and SMART static GTFS files directly. Both are free downloads (DDOT valid through February 7, 2027; SMART valid through January 3, 2027). Query `stop_times.txt` for the last trip on a given route after a given time. This is roughly 40 lines of Python with `pandas` or the standard `csv` module. **Have the person owning the backend start the GTFS parser immediately in parallel with testing the Routes API.** If Routes works, the GTFS parser becomes a validation layer. If it doesn't, it becomes the core.

Hard-coded sample data is the last resort. It is acceptable for a demo, but be ready for a judge to ask whether the data is live. Have an honest answer.

### Risk 2 — `scripts/deploy.sh` has not been run

The team's role on the IBM Cloud account is Viewer on the resource group. Terraform cannot create new service instances. The deploy script creates a Container Registry namespace — confirm that a Viewer can do that before the pitch. If the namespace step fails, build and push the image manually (`ibmcloud cr namespace-add` and `docker push`) and have Terraform manage only the Code Engine app.

### Risk 3 — Granite model ID

`ibm/granite-4-h-small` is confirmed as the only Granite chat model available. It is already set as the default in [`backend/app/config.py`](../backend/app/config.py:17). Do not change it without confirming what is in the account; the `lru_cache` on `_model()` in [`backend/app/granite.py`](../backend/app/granite.py:15) means a wrong ID fails fast on first use.

### Risk 4 — Lovable credits (now moot)

The stack decision dropped Lovable. The frontend is React/Vite. This risk is closed.

### Risk 5 — Cold-start latency on Code Engine

Code Engine can take a few seconds to spin up after inactivity. For a live demo, hit the health endpoint once immediately before going on stage. Alternatively, set the minimum number of instances to 1 in `infra/main.tf` (the Code Engine app resource).

### Risk 6 — GTFS file size in memory

DDOT and SMART GTFS zips are small (likely under 10 MB each), but loading and parsing them on every request is slow. Cache the parsed `stop_times` lookup in a module-level dict on startup in the Cloud Run / Code Engine instance. Not a blocker, but noticeable in a live demo.

---

## 6. Simplest working architecture

The stack decision is made. This is what to build:

```
[React / Vite frontend]
    |
    | POST /api/check-commute
    |   { origin, destination, shift_start, shift_end }
    v
[FastAPI on IBM Code Engine]
    |
    |── Google Routes API (2 calls: arrive_by + depart_after)
    |      └── fallback: GTFS stop_times parse if Routes returns nothing
    |── risk_score() — pure Python, no model needed
    |── granite.chat(risk_json) — 1 call, returns explanation string
    |
    returns: { verdict, score_factors, explanation, backup_options[] }
```

**Person split (3 people, unblocked in parallel):**

| Person | Owns |
|---|---|
| A | Google Routes API integration + GTFS fallback parser (`backend/app/routes.py`) |
| B | Risk score function + Granite prompt + `/api/check-commute` endpoint wiring + deploy |
| C | Frontend: input form → POST → verdict screen showing badge + Granite sentence |

**What to skip:** Supabase, Vertex AI / Gemini, watsonx Orchestrate, NWS weather, crash overlays, any database.

---

## 7. Pitch

**One-sentence problem statement:**

> A Detroit worker without a car has no way to know, before accepting a job, whether the bus will get them home after a late shift — so they turn down jobs they could have taken, or accept them and lose them when the commute fails.

**3-sentence demo story (one worker):**

> Maya lives near Jefferson and Chalmers and was just offered a second-shift assembly job at a Warren plant, 3 to 11:30 PM. She opens Commute Check, enters the address and her shift, and sees: *"Risky — the last SMART bus leaves 17 minutes after your shift ends. With SMART running at 68% on time, one delay strands you. Ask for the 10:30 PM shift, or join the MichiVan vanpool that serves this route for $55 a month."* Maya negotiates the shift, the plant fills a spot it could not staff, and that is the Wayne County transit vote paying off in one job.

---

## 8. Open questions — decide before writing code

1. **Has anyone called the Google Routes API for a transit trip departing Warren at 11:30 PM?** This is the go/no-go for the Routes-first path. Do it in the next 15 minutes. If the result is empty, switch to the GTFS parser as primary.

2. **Has `scripts/deploy.sh` been run, or at least `ibmcloud cr namespace-add` been tested?** The deploy path has never executed. Know whether it works before it matters.

3. **Who owns what?** Agree on the three-way split above (Person A = routing, Person B = backend + deploy, Person C = frontend) before anyone writes a line. The scaffold is ready; the MUST features need three parallel tracks.

4. **Is the demo the worker view only, or worker + employer?** Worker view is MUST. Employer view ("X of Y applicants can make this shift") is NICE. Person C should build the worker screens first; add employer view only if the worker flow is done by approximately 3:30 PM.

5. **Product name.** "Commute Check" is the placeholder in the scaffold and the UI. If the team is changing it, change it now — it appears in `main.py`, `App.tsx` and the root `README.md`.

6. **What is the sample-data fallback for the demo?** Agree on three canned scenarios (one yes, one risky, one no) using real addresses from the RTA study (Jefferson North plant, Amazon Fairgrounds, Cadillac Stamping) so the fallback is credible if Routes fails during the pitch.
