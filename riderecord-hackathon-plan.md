# RideRecord — 15-Hour Hackathon Build Plan
### IBM Cloud + Google Cloud · Built from `michigan-accessible-transit-problem-statement.md`

*Hackathon edition · November 13, 2026*

---

## 0. How this plan relates to the original

The original plan (`michigan-accessible-transit-problem-statement.md`) is a ~17-week roadmap. This plan keeps its **problem (§1)**, **solution layers (§2.1)**, **incident taxonomy (§2.3)**, and **data model (§6)**, and compresses them into a demo-ready build that proves the core idea in 15 hours.

| Original plan | Hackathon version |
|---|---|
| Phase 0 (rider interviews) | **Replaced** by news-sourced evidence + synthetic demo data (see `seed_data.json`); interviews stay on the "next steps" slide |
| Layer 1 — Ride Log | **Built**: tap logging **+ voice logging** (new, the demo's "wow" moment) |
| Layer 2 — Complaint Builder | **Built**: AI-drafted complaints, routed to the right channel, with deadlines |
| Layer 3 — Reliability Dashboard | **Built** on synthetic data, clearly labeled, with a pattern flag tied to 49 CFR §37.131(f) |
| SMS line (Twilio) | **Cut** unless rules allow third-party services; voice logging covers the "no-typing" accessibility need |
| Phone OTP auth, caregiver mode | **Cut** → demo accounts; caregiver mode is a stretch goal |
| Cross-provider navigator | Stays in "Later" |

> **One-sentence pitch:** RideRecord lets Michigan paratransit and Medicaid riders log a failed ride by voice in 10 seconds, turns their logs into complaints routed to the right agency before the deadline, and gives advocates independent data on patterns federal law prohibits.

---

## 1. Why this matters (pitch evidence, all from reliable sources)

Use these on the problem slide. Full citations are in `seed_data.json → evidence[]`.

- **About 1 in 5 Michiganders have a disability**, and in Detroit that's **128,000+ residents**.
- **Detroit paratransit history:** years of complaints about missed pickups, long waits, and poor service; a 2022 fight over a ~$50M Transdev contract; emergency short-term contracts with four local companies in 2023.
- **It's improving, but the data is self-reported:** DDOT launched same-day "DDOT Now" in June 2025, says each provider is at **≥98% on-time**, and publishes its own performance dashboard. *RideRecord adds the rider's side.*
- **The gaps between systems are a live issue:** in a February 2026 letter to Mayor Sheffield, a coalition including Transportation Riders United called for **"borderless paratransit"** so riders don't have to transfer at the city limit.
- **Medicaid rides:** a Farmington Hills man in a powered wheelchair missed **nearly a dozen appointments** in early 2026 because of last-minute cancellations, vans that couldn't fit his chair, and a return ride that never came. The broker pointed to its contractors, and the insurer cited privacy rules.
- **Timely:** Michigan's Auditor General has an **in-progress audit of Medicaid non-emergency transportation** covering **$160.5M** in spending (Oct 2024–Mar 2026), with release expected late 2026.
- **The legal hook:** 49 CFR §37.131(f) prohibits *patterns* of substantial numbers of untimely pickups, missed trips/denials, and excessively long trips. The rules don't define "substantial." The **FTA's civil rights complaint form has a section specifically for paratransit on-time performance** and asks for dates and times, which is exactly what RideRecord collects.

---

## 2. Scope: what to build in 15 hours

### P0 — must work in the demo
1. **Quick Log (tap):** pick provider → outbound/return → outcome (on time / late + minutes / no-show / wrong vehicle / denied / too long / long hold) → save. ≤3 taps.
2. **Voice Log:** rider says *"My return ride never came and I waited two hours"* → **IBM Watson Speech to Text** → **watsonx.ai (Granite)** extracts structured incident JSON → confirmation screen read aloud → save.
3. **Complaint Builder:** select incidents → **watsonx.ai** drafts a plain-language complaint using *only* logged facts → routed to the correct channel (DDOT ADA Coordinator, FTA Office of Civil Rights, Medicaid health plan) → **180-day deadline countdown** → copy / download / email draft. *Rider reviews and sends; nothing auto-submits.*
4. **Reliability Dashboard:** synthetic data (labeled "Demo data") for **fictional providers** ("Demo Paratransit A," "Demo Medicaid Rides E," …) aggregated by provider, month, and trip direction in **BigQuery**; charts plus an accessible data table; a **"possible pattern" flag** when a provider's late/missed rate crosses a threshold.

### P1 — if ahead at the Hour 10 checkpoint
- **Map view** (Google Maps) of incidents by ZIP code (never addresses)
- **Read-back** of confirmations with **IBM Watson Text to Speech** (big win for blind and low-vision riders)
- Ride history timeline + PDF export
- AI "pattern summary" paragraph on the dashboard (Granite summarizes the aggregates for advocates)

### P2 — stretch only
- Caregiver mode
- Spanish / Arabic voice logging (large Arabic-speaking community in Metro Detroit)
- watsonx Orchestrate agent that walks a rider through filing
- SMS logging (only if rules allow third-party services)

### Explicitly out of scope today
Real rider data, real complaint submission, auth beyond demo accounts, the cross-provider navigator.

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  React PWA (Vite)                    — Firebase Hosting / Cloud Run │
│  Quick Log · Voice Log · Complaints · Dashboard · History           │
└───────────────┬────────────────────────────────────────────────────┘
                │ REST (JSON)
┌───────────────▼────────────────────────────────────────────────────┐
│  FastAPI backend (Python)                       — GCP Cloud Run     │
│  /log  /voice  /extract  /complaints  /stats  /providers            │
└──────┬──────────────┬─────────────────┬─────────────────┬──────────┘
       │              │                 │                 │
┌──────▼──────┐ ┌─────▼────────────┐ ┌──▼──────────────┐ ┌▼─────────────┐
│ IBM Watson  │ │ IBM watsonx.ai   │ │ GCP Firestore   │ │ GCP BigQuery │
│ Speech to   │ │ Granite: extract │ │ riders, trips,  │ │ aggregates + │
│ Text (+TTS) │ │ incidents, draft │ │ incidents,      │ │ synthetic    │
│             │ │ complaints,      │ │ complaints      │ │ demo dataset │
│             │ │ summarize stats  │ │                 │ │              │
└─────────────┘ └──────────────────┘ └─────────────────┘ └──────────────┘
                                                     (P1) Google Maps JS API
```

**Division of labor between the two clouds (say this to judges):**
- **IBM = the intelligence layer:** speech recognition, structured extraction, and complaint drafting with Granite, an enterprise model with IBM indemnification, which matters for a tool handling sensitive rider data.
- **Google = the app and data layer:** serverless hosting, the operational database, analytics at scale, and maps.

### Swap table (adjust once you see what IBM provisioned)

| If IBM gave you… | Use it for | Instead of |
|---|---|---|
| watsonx.ai (almost certain) | All LLM work | — (keep) |
| Watson Speech to Text | Voice logging | GCP Speech-to-Text |
| Watson Text to Speech | Read-back (P1) | Browser `speechSynthesis` |
| Cloudant | Operational DB | Firestore |
| Code Engine | Backend hosting | Cloud Run |
| Cloud Object Storage | Complaint PDFs | Cloud Storage |
| watsonx Orchestrate | Filing-assistant agent (P2) | — |
| Db2 / watsonx.data | Analytics | BigQuery (keep BigQuery if you want a strong GCP story) |

**Rule of thumb:** whatever's provisioned on IBM, keep **at least two meaningful IBM services** and **at least two meaningful GCP services** in the critical demo path.

---

## 4. Key implementation details

### 4.1 watsonx.ai setup (Python)
```python
# pip install ibm-watsonx-ai
from ibm_watsonx_ai import Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

model = ModelInference(
    model_id="ibm/granite-4-h-small",   # confirm with the list call below; use the newest Granite instruct model in your project
    credentials=Credentials(url="https://us-south.ml.cloud.ibm.com", api_key=WX_API_KEY),
    project_id=WX_PROJECT_ID,
    params={"decoding_method": "greedy", "max_new_tokens": 600},
)
# First thing in Hour 0: list models available to your project and pick one
# (APIClient(credentials).foundation_models.TextModels shows the IDs)
```

### 4.2 Prompt: incident extraction (temperature 0, JSON only)
```
You extract paratransit ride incidents from a rider's spoken description.
Return ONLY valid JSON matching this schema, with no extra text:
{"provider": string|null, "direction": "outbound"|"return"|null,
 "incident_types": [one or more of: "late_pickup","no_show","trip_denied",
   "excessive_length","long_hold","wrong_vehicle","driver_conduct","other"],
 "minutes_late": integer|null, "date_mentioned": string|null,
 "summary": string (one plain-language sentence)}
Rules: Never guess numbers that were not said. If unsure, use null.
Known providers: DDOT Paratransit, DDOT Now, SMART ADA, Modivcare, SafeRide.
Rider said: "{transcript}"
```
Validate with Pydantic. On parse failure, fall back to the Quick Log form pre-filled with the transcript. No retry: at temperature 0 the same prompt returns the same answer.

### 4.3 Prompt: complaint drafting
```
Write a short, polite, factual complaint letter from a paratransit rider.
Use ONLY the facts in INCIDENTS. Do not invent names, times, or outcomes.
Address it to: {channel_name}. Reading level: 6th–8th grade.
Structure: who I am (rider ID only) → what happened (bulleted, dated) →
why it matters (missed care/work if stated) → what I'm asking for →
note that repeated late/missed trips may indicate a pattern prohibited
under 49 CFR 37.131(f). End with "[Rider signature]".
INCIDENTS: {incidents_json}
```
Always show this note in the UI: *"This is a draft to help you file. It is not legal advice. Review before sending."*

### 4.4 Routing logic (deterministic, not AI)
| Service type | First channel | Escalation |
|---|---|---|
| DDOT paratransit / DDOT Now | DDOT ADA Coordinator (180 days) | FTA Office of Civil Rights |
| SMART ADA paratransit | SMART (confirm channel on smartbus.org) | FTA Office of Civil Rights |
| Medicaid NEMT (Modivcare, SafeRide, etc.) | Rider's Medicaid health plan grievance | State agency (confirm) |

The FTA encourages filing with the local agency first, so show escalation only after a local complaint exists or goes unanswered. Contact details for each channel are in `seed_data.json → complaint_channels[]`.

### 4.5 Pattern flag (dashboard)
Flag a provider/month when **late (>30 min) + no-show + denied ≥ 10% of logged trips** *and* **n ≥ 30 trips**. Label it **"Possible pattern — worth investigating,"** never "violation." The threshold is a **demo assumption**, since the regulation doesn't define "substantial"; say so on screen.

### 4.6 Accessibility (judges will check, and it's the product)
- Semantic HTML, labeled buttons, visible focus, 44×44px targets, high contrast
- Every chart has an equivalent **data table**
- Voice Log has a big, single "Hold to talk" / "Tap to talk" button with live caption
- Run **axe DevTools** on every screen and do one **VoiceOver/TalkBack** pass before demo

---

## 5. Data

| Dataset | Source | Use |
|---|---|---|
| `evidence[]` | Reliable news, government, and research sources (in `seed_data.json`) | Pitch slides, "About" page |
| `providers[]` | Public agency info (DDOT, SMART, CATA, Medicaid brokers) | Provider picker |
| `complaint_channels[]` | Official agency/FTA pages | Complaint routing |
| Synthetic trips | `generate_synthetic_trips.py` (seeded, reproducible, **fictional providers only**) | Dashboard + BigQuery |

**Honesty rules for the demo:**
- Every chart built on synthetic data shows a **"Demo data, not real riders"** badge.
- Synthetic data uses **fictional providers only**. Real agency names (DDOT, SMART, Modivcare, SafeRide) appear **only** in the provider picker and complaint routing, **never** in dashboard statistics. A "possible pattern" flag on a real agency built from fake data would be misleading.
- Real stats come only from `evidence[]`. Judges respect this, and it's the right call for a civil-rights tool.

With `--seed 42` (3,000 trips), the flag fires on exactly **two planted spikes**: *Demo Medicaid Rides E* in Sept 2026 and *Demo Suburban C* in Oct 2026. Return trips have about twice as many incidents as outbound trips. Both make good demo talking points.

Load synthetic data:
```bash
python generate_synthetic_trips.py --trips 3000 --seed 42 --out trips.csv
bq load --source_format=CSV --autodetect riderecord.trips trips.csv
```

---

## 6. Team roles (adapt to team size)

| Role | Owns | P0 deliverable |
|---|---|---|
| **A — Frontend** | React PWA, accessibility | Quick Log, Voice Log UI, Complaint screen, Dashboard UI |
| **B — Backend** | FastAPI, Firestore, Cloud Run deploy | `/log`, `/voice`, `/complaints`, `/providers`; deployed URL by Hour 3 |
| **C — IBM AI** | watsonx.ai, Speech to Text, prompts, validation | `/extract` and complaint drafting working on 10 test transcripts |
| **D — Data + Pitch** | BigQuery, synthetic data, `/stats`, deck, demo script | Dashboard data live by Hour 8; deck by Hour 12 |

*Team of 3:* merge B + D. *Solo:* do P0 #1, #2, #3, and fake the dashboard with a static BigQuery query result.

---

## 7. Hour-by-hour schedule (15 hours)

| Hour | Everyone | Checkpoint |
|---|---|---|
| **0:00–0:45** | Repo + README, list provisioned IBM services, create API keys, confirm Granite model ID, "hello world" FastAPI on Cloud Run, React skeleton | ✅ Each person can call their service |
| **0:45–1:30** | Lock the API contract + Firestore schema (from original plan §6), load `seed_data.json`, generate synthetic trips → BigQuery | ✅ Contract frozen |
| **1:30–4:00** | A: Quick Log + layout · B: endpoints + Firestore · C: STT + extraction prompt · D: BigQuery views + `/stats` | — |
| **4:00–4:30** | **Integration #1:** tap log → saved in Firestore → visible in history | ✅ First end-to-end |
| **4:30–7:30** | A: Voice Log UI + Complaint screen · B: complaint routing + deadline logic · C: complaint prompt + guardrails · D: dashboard charts + pattern flag | — |
| **7:30–8:00** | **Integration #2:** voice → extract → confirm → save → appears in complaint builder | ✅ Core demo path works |
| **8:00–10:00** | Finish P0 polish; Complaint Builder end-to-end; dashboard on deployed URL | — |
| **10:00** | **Go/no-go on P1.** If P0 isn't solid, *no new features*, just fix | ✅ Feature freeze for P0 |
| **10:00–12:00** | P1 items (TTS read-back → map → AI pattern summary), accessibility pass (axe + screen reader), seed demo accounts | — |
| **12:00–13:30** | **Code freeze.** Deck (6 slides), demo script, **record a backup demo video**, README with architecture + setup | ✅ Submission draft |
| **13:30–15:00** | Rehearse 3×, fix only demo-breaking bugs, submit early | ✅ Submitted with buffer |

**Rules for staying on schedule:** checkpoints are hard stops, any task stuck for 45+ minutes gets cut or simplified, and nobody starts P1 before the Hour 10 go/no-go.

---

## 8. Demo script (3 minutes)

1. **Hook (20s):** *"Earlier this year, a Michigan man in a powered wheelchair missed nearly a dozen doctor's appointments because his rides kept failing. When he complained, the ride company blamed its contractors and his insurer cited privacy. No one owned it."*
2. **Problem (25s):** 1 in 5 Michiganders have a disability. Federal law bans *patterns* of late and missed paratransit trips, but the only data comes from the agencies themselves.
3. **Live demo: Voice Log (40s):** fictional rider "Denise" taps *Talk*: *"My return ride from Henry Ford never came. I waited an hour and forty minutes."* → transcript → structured incident → confirmation read aloud → saved.
4. **Live demo: Complaint (40s):** select 3 incidents → Granite drafts the letter → routed to DDOT ADA Coordinator → "162 days left to file" → download.
5. **Live demo: Dashboard (30s):** *(Demo data badge visible)* "Demo Medicaid Rides E" flagged as a possible pattern in September; return trips fail about twice as often as outbound; show the accessible table view.
6. **Close (25s):** Built on IBM watsonx.ai + Watson Speech and Google Cloud Run + Firestore + BigQuery. Next: pilot with Detroit disability advocacy groups, with Michigan's Auditor General NEMT audit due late 2026.

---

## 9. Judging alignment checklist

- [ ] **Impact:** real, cited problem; named beneficiaries; clear next step (pilot with advocates)
- [ ] **Technical:** voice → structured data → AI drafting → analytics, all deployed
- [ ] **Sponsor tech:** ≥2 IBM services and ≥2 GCP services in the live demo path
- [ ] **Design/accessibility:** screen-reader pass, voice input, data tables for charts
- [ ] **Responsible AI:** AI only drafts; humans send; no invented facts; synthetic data labeled; ZIP-level location only; "not legal advice" notice
- [ ] **Feasibility:** costs stay low (serverless); open-source; partner-owned roadmap

---

## 10. Risks today

| Risk | Fallback |
|---|---|
| watsonx.ai rate limits / latency | Cache extraction results for demo transcripts; show a loading state with live transcript |
| Speech to Text mic issues on venue Wi-Fi | Upload a pre-recorded `.wav` of the demo sentence |
| JSON parse errors from the model | Pydantic validation + pre-filled manual form |
| Deploy breaks at Hour 13 | Freeze at 12:00; keep the last good Cloud Run revision; have the backup video |
| Scope creep | Hour 10 go/no-go; P1 only in listed order |

---

## 11. After the hackathon → back to the original plan

Pick up at **Phase 0 (Validate)** in `michigan-accessible-transit-problem-statement.md` §5 and use the demo to open doors with Disability Rights Michigan, Transportation Riders United, and Warriors on Wheels of Metro Detroit.
