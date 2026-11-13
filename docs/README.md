# Project docs

Context for anyone, human or coding agent, picking up this repo.

## What we are building

**RideRecord**, for the Michigan DevFest AI Hackathon 2026 (Mobility track, team of three). Riders with disabilities who depend on paratransit and Medicaid rides log each trip by tap or by voice, turn logged problems into a complaint addressed to the right office, and feed an anonymized reliability dashboard for advocates.

The team pivoted to RideRecord on the afternoon of November 13, 2026. Before that the repo was scaffolded for a different idea, a shift-aware commute check. Anything that still mentions "Commute Check" is left over from that.

## Read in this order

| File | What it is |
|---|---|
| `../michigan-accessible-transit-problem-statement.md` | **The problem, the full solution and the 17-week plan.** Source of truth for what RideRecord is. |
| `../riderecord-hackathon-plan.md` | **What we build today.** Scope (P0/P1/P2), architecture, prompts, routing table, pattern flag, demo script. |
| `why-we-are-building-this.md` | One-page version: the person, the evidence, what we do and do not claim. |
| `../README.md` | What is built, which tool does what, how to run and deploy. |
| `hackathon-requirements.md` | Every hackathon rule and judging criterion, written as a checklist. |
| `ci-cd.md` | The GitHub Actions workflows and their one-time setup. |
| `../seed_data.json` | Cited evidence, real providers and real complaint channels. Entries marked `TODO_VERIFY` are not confirmed. |

### Google Doc exports (`google-doc/`)

Snapshots of the team's Google Doc ("MDevFest") from November 13, about 12:10 PM ET, **before the pivot**.

| File | Still applies? |
|---|---|
| `01-hackathon-workbook.md` | **Yes, the rules and checklists.** Its filled-in answers are sample text about another app ("BusPulse"). |
| `03-tech-resources.md` | **Yes.** Platforms, credits, deadlines, judging criteria. |
| `02-research-report.md` | **Background only.** Research behind the earlier commute-check idea. It does cover disability mobility and Medicaid rides as candidate problems. |
| `04-business-model-canvas.md` | **No.** The canvas for the commute check. RideRecord has no canvas yet. |

## Status

### Built and checked locally (November 13, about 3:45 PM ET)

- **Backend** (`backend/`): FastAPI with `/api/trips`, `/api/extract`, `/api/voice`, `/api/complaints`, `/api/stats`, `/api/providers`, `/api/health`. 15 tests pass; ruff is clean.
- **Frontend** (`frontend/`): four screens (Log a ride, Talk, Complaints, Dashboard). Builds and lints clean. Clicked through in a browser with no keys set: logging a ride, drafting a complaint (routed to the DDOT ADA Coordinator, "162 days left to file"), the typed fallback on Talk, and the dashboard with its two planted flags.
- **Infra** (`infra/`): Terraform for Cloud Run, Firestore, BigQuery, Artifact Registry and Secret Manager. `terraform validate` passes.
- **Synthetic data**: with seed 42 the pattern flag fires on exactly the two planted spikes, and return trips fail more than 1.5 times as often as outbound. A test asserts both.

### Not verified yet

Check each one before building on it or saying it in the pitch.

- **Nothing has run against a real cloud service.** No live call to Granite, to Watson Speech to Text, to Firestore or to BigQuery. Tests replace those calls.
- **Speech to Text may not accept the IBM Cloud API key.** `speech.py` sends `IBMCLOUD_API_KEY` to the STT instance; if that is refused, put the instance's own key in `STT_API_KEY`.
- **Microphone recording has not been tried.** The browser records WebM/Opus and the backend passes that content type to Watson. If Watson rejects it, upload a `.wav` (the Talk screen has an upload field).
- **Nothing is deployed.** `scripts/deploy.sh` has not run. The team needs a Google Cloud project with billing; none is named in this repo.
- **The GitHub Actions workflows have not run** since the rewrite. The Docker image has not been built.
- **No accessibility test.** The markup is semantic, labeled and keyboard-reachable by design, but nobody has run axe, VoiceOver or TalkBack on it. The plan calls this a release gate.
- **Two complaint channels are unconfirmed** (`TODO_VERIFY` in `seed_data.json`): SMART, and the Medicaid health plan grievance path. The app shows a "not confirmed" message for both.
- **No rider or advocate has seen any of this.**

### Decided

- **Stack.** FastAPI and React in one container on **Google Cloud Run**; trips in **Firestore**; dashboard aggregates in **BigQuery**; **IBM Granite** on watsonx.ai for extraction and drafting; **IBM Watson Speech to Text** for voice. IBM Code Engine, which the old scaffold deployed to, is no longer used.
- **Every cloud service has a local stand-in** so the demo survives a failure: memory for Firestore, `trips.csv` for BigQuery, a fixed template for the complaint draft, typing for speech.
- **Demo account only.** One fictional rider, no sign-in. The API trusts the `rider_id` it is sent, which is acceptable only because there is no real data.

### Deadline

Submissions close at **6:00 PM ET on November 13, 2026**, with pitches at 6:30 PM and winners at 7:30 PM. Aim to submit at 5:45 PM. The IBM competition page separately lists Sunday, November 15 at 2:00 PM ET; treat that as a backstop only if an organizer confirms it.

## Rules that apply to this repo

From the organizers' workbook and keynote. `hackathon-requirements.md` has the full checklist.

- The repo must be public for submission. Never commit API keys or other secrets. Use environment variables.
- Use only data the team is allowed to use. No personal, client, confidential or social media data. **For RideRecord this means no real rider data, ever, in this build.** Keep a list of every public data source (root `README.md`, "Data sources").
- Record which AI tools and models were used, including coding assistants (root `README.md`, "AI tools used").
- Hackathon cloud accounts close after the event. Push code to GitHub before then.

## Judging

Five criteria, 5 points each, 25 total:

1. Completeness and feasibility, including how clearly IBM technology is applied
2. Creativity and innovation
3. Design and usability
4. Effectiveness and efficiency
5. Michigan impact: keeping value, jobs and opportunity in Michigan
