# Hackathon requirements checklist

Written November 13, 2026. This file holds every rule and expectation for the Michigan DevFest AI Hackathon 2026 that appears in this repo's docs, written so a person or an LLM can check the project against it.

It lists requirements, not progress. Current progress is in the Status section of `README.md` in this folder.

## Instructions for an LLM reviewer

1. Read this file, then `why-we-are-building-this.md`, `../riderecord-hackathon-plan.md` and the root `README.md`.
2. Check every requirement below. Use its **Check** line. Look at the repo itself (files, git history, GitHub settings), not at what a doc claims.
3. Report each one as **PASS**, **FAIL**, **CAN'T VERIFY** (needs something outside the repo, such as the Google Doc, the submission form or the time), or **N/A YET** (a deliverable that isn't due yet). Give one line of evidence for each: a file and line, a command and its output, or the reason it can't be checked.
4. List the **FAIL** items in the hard-rule section (H) first. A project that breaks these can be disqualified.
5. Don't fix anything unless asked. Never print a secret you find. Give its file and line only.
6. The Google Doc "MDevFest" is the source of truth. If a requirement here disagrees with it, say so and don't guess.

## Key facts

| Fact | Value |
|---|---|
| Event | Michigan DevFest AI Hackathon 2026, Mobility track, team of three |
| Submission deadline | **6:00 PM ET, November 13, 2026** (hard close). Target 5:45 PM. |
| Pitches / winners | 6:30 PM / 7:30 PM ET |
| Backstop deadline | The IBM page lists Sunday, Nov 15, 2:00 PM ET. Count on it only if an organizer confirms. |
| Product | RideRecord: ride logging, complaint drafting and a reliability dashboard for paratransit and Medicaid riders. See `why-we-are-building-this.md`. The team pivoted to it from a commute-check idea on the afternoon of November 13. |
| Competition page | https://compete.112601.watsonx-challenge.ibm.com/competitions/midevfest |

## H. Hard rules (can be disqualified)

Source: the organizers' workbook (`google-doc/01-hackathon-workbook.md`, "Tech and data rules") and the keynote (`google-doc/03-tech-resources.md`).

| ID | Requirement | Check |
|---|---|---|
| H1 | The GitHub repo is **public** at submission. | `gh repo view --json visibility` returns `PUBLIC`. |
| H2 | No API keys, tokens or passwords in the repo, **including git history**. Any key that was ever pushed must be rotated. | `git ls-files` shows no `.env` (only `.env.example`). `git log --all -p` has no Google keys (`AIza…`), no filled-in `IBMCLOUD_API_KEY=` / `STT_API_KEY=` lines, no service account key JSON, no `*.tfstate` and no `*.tfvars`. `.gitignore` covers `.env`, `*.tfstate` and `*.tfvars`. |
| H3 | Secrets are read from environment variables, never hard-coded. | Code reads keys through `backend/app/config.py` settings or env vars. No key-shaped string literals in `backend/`, `frontend/`, `infra/` or `scripts/`. |
| H4 | Only data the team may use. **No personal, client, confidential or social media data.** | **No real rider data anywhere.** The only rider is the fictional demo account. Trips on the dashboard are synthetic (`is_synthetic=true`) and use fictional providers. Phone numbers and addresses in `seed_data.json` belong to public agency offices, not people. |
| H5 | A list of **every public data source** used, with links. | A "Data sources" section in the root `README.md` (proposed location; the rule doesn't say where) names each data set the app uses. Every entry in `seed_data.json` carries its source URL. |
| H6 | Every AI tool and model used is recorded, **coding assistants included**. | The root `README.md` "AI tools used" section names each one with what it did. Currently known: Claude (research, docs, code), IBM Bob (review of the earlier idea), IBM Granite `ibm/granite-4-h-small` and IBM Watson Speech to Text (in the product). Add any other tool the team used. |
| H7 | Work is backed up to GitHub before the hackathon cloud accounts close. | All branches meant for submission are pushed: `git status -sb` shows nothing ahead of `origin`. |
| H8 | The Lovable discount code stays out of the repo (the keynote asked teams to keep it in the room). | It doesn't appear in any file or commit. |

## S. Submission deliverables

Source: the workbook's "Submission checklist" and `google-doc/03-tech-resources.md` "Pitch and submission".

| ID | Requirement | Check |
|---|---|---|
| S1 | **Problem statement**, one sentence: *[User] struggles to [task] because [reason], which costs them [impact].* | Written for RideRecord (not the BusPulse sample) in the repo and in the Google Doc workbook. The repo copy can be checked; the Google Doc is CAN'T VERIFY. |
| S2 | **Solution / value proposition**, one sentence: *For [user], [project] is a [type of tool] that [key benefit], unlike [existing solution], which [falls short how].* | Same as S1. |
| S3 | **IBM and/or Google tools listed, with what each one does** in the app. | A stack table in the root `README.md` names each tool and its job, and matches the code. It is the "Which tool does what" table. |
| S4 | **One-minute demo video** on a public link (YouTube unlisted is fine). It shows the product working, not slides. | The link is in the root `README.md`. CAN'T VERIFY its content. |
| S5 | The team lead submits **before 6:00 PM ET**. | CAN'T VERIFY from the repo. |
| S6 | The pitch is rehearsed and timed. Confirm the presentation length with the organizers. | CAN'T VERIFY. |

## J. Judging criteria (5 points each, 25 total)

Source: the keynote, recorded in `README.md` (this folder) and `google-doc/03-tech-resources.md`. The organizers published the criteria only, not a rubric for each point. The **What earns it** column is the organizers' advice and the team's research, not the official scoring.

| ID | Criterion | What earns it | Check |
|---|---|---|---|
| J1 | Completeness and feasibility, **including how clearly IBM technology is applied** | The demo works end to end on the deployed app. **Granite produces visible output** in the product: the structured incident from speech, and the complaint letter. Watson Speech to Text is in the same path. | `/api/voice`, `/api/extract` and `/api/complaints` call IBM services with real keys on the deployed URL, and `/api/health` reports `watsonx_configured` and `stt_configured` true. The complaint screen says "Drafted by IBM Granite", not "template". |
| J2 | Creativity and innovation | The rider's own record, independent of agency self-reporting, mapped to the federal categories in 49 CFR 37.131(f). Agency apps manage trips; they do not give the rider evidence. | Incident types match the table in the problem statement §2.3. The pitch names the contrast with agency-reported on-time figures. |
| J3 | Design and usability | **Accessibility is the product.** The four Design for AI questions are answered: what the AI does, where the human stays in control (the rider confirms every extraction and sends every complaint), what happens when the AI is wrong (manual form, editable draft), how the app earns trust (facts only, labeled drafts, labeled demo data). | axe shows no violations on each screen. One full pass with a screen reader and with the keyboard only. Every control is at least 44 px. The dashboard's data is in tables. |
| J4 | Effectiveness and efficiency | A log takes seconds. Sample data is clearly labeled. | A routine tap log is three taps. The dashboard shows "Demo data, not real riders". The team has an honest answer ready for "is this data real?" |
| J5 | Michigan impact: keeping value, jobs and opportunity in Michigan | Riders reach medical care and work; advocates get evidence; the state's Medicaid ride audit is due in late 2026. | The pitch or README states the Michigan impact using figures from `seed_data.json → evidence[]` only. |

## P. Product guardrails (team decisions in `why-we-are-building-this.md` and `../riderecord-hackathon-plan.md`)

| ID | Requirement | Check |
|---|---|---|
| P1 | **AI drafts, the rider sends.** Nothing is submitted automatically. | No code sends email or posts a form. The complaint screen offers copy, download and a `mailto:` link only. |
| P2 | **No invented facts in a complaint.** Granite gets only the logged incidents, and every draft shows: "This is a draft to help you file. It is not legal advice. Review before sending." | `backend/app/complaints.py`: the prompt and the disclaimer. The draft is editable before it leaves the app. |
| P3 | **Synthetic data is labeled and uses fictional providers only.** Real agency names (DDOT, SMART, Modivcare, SafeRide) appear only in the provider picker and complaint routing, never in dashboard statistics. | `generate_synthetic_trips.py` lists only "Demo ..." providers. The dashboard shows the "Demo data, not real riders" notice. |
| P4 | **A flag is "possible pattern, worth investigating", never "violation".** The threshold (10% of at least 30 trips) is a demo assumption and the screen says so. | Search the frontend and the pitch for "violation": it appears only in "not a finding of a violation". |
| P5 | **No invented statistics.** Every real-world figure in the UI, README or pitch traces to `seed_data.json → evidence[]`. | Each number in user-facing text matches an evidence entry. |
| P6 | **Entries marked `TODO_VERIFY` are not shown as real.** | For SMART and the Medicaid plan grievance channel the app shows a "not confirmed" message, not contact details. |
| P7 | **Privacy.** No street addresses, no diagnoses, no real riders. Location is ZIP-level at most. | The trip model has no address or diagnosis field. The notes field asks riders to leave both out. |
| P8 | Out of scope today: **real complaint submission, sign-in, SMS, the cross-provider trip planner.** | None of these exist in the code. |
| P9 | Build and demo for **one specific person**: "Denise", a fictional Detroit paratransit rider whose return rides fail. | The demo follows the script in `../riderecord-hackathon-plan.md` §8. |

## K. Keynote advice (not scored directly)

- Build for one specific person, not everyone.
- Talk to someone who has the problem before writing code.
- Scope small. Finished beats fancy.
- Demo the thing itself, not slides about it.
- Pitch your thinking out loud, including what you didn't solve. Name exactly which IBM and Google tools do what.

## Before the repo goes public

- `docs/google-doc/*` link to the team's Google Doc. Once the repo is public, anyone can open that doc if its link sharing is on. Check its sharing setting, or remove the links.
- The app has no sign-in and trusts the `rider_id` it is sent. That is fine for a demo account and synthetic data. Do not let anyone enter real rides into the deployed demo.
