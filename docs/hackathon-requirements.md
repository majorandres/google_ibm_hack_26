# Hackathon requirements checklist

Written November 13, 2026. This file holds every rule and expectation for the Michigan DevFest AI Hackathon 2026 that appears in this repo's docs, written so a person or an LLM can check the project against it.

It lists requirements, not progress. Current progress is in the Status section of `README.md` in this folder.

## Instructions for an LLM reviewer

1. Read this file, then `why-we-are-building-this.md`, then the root `README.md`.
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
| Product | Shift-aware commute check (working name "Commute Check"). See `why-we-are-building-this.md`. |
| Competition page | https://compete.112601.watsonx-challenge.ibm.com/competitions/midevfest |

## H. Hard rules (can be disqualified)

Source: the organizers' workbook (`google-doc/01-hackathon-workbook.md`, "Tech and data rules") and the keynote (`google-doc/03-tech-resources.md`).

| ID | Requirement | Check |
|---|---|---|
| H1 | The GitHub repo is **public** at submission. | `gh repo view --json visibility` returns `PUBLIC`. |
| H2 | No API keys, tokens or passwords in the repo, **including git history**. Any key that was ever pushed must be rotated. | `git ls-files` shows no `.env` (only `.env.example`). `git log --all -p` has no Google keys (`AIza…`), no filled-in `IBMCLOUD_API_KEY=` / `GOOGLE_MAPS_API_KEY=` lines, no `*.tfstate` and no `*.tfvars`. `.gitignore` covers `.env`, `*.tfstate` and `*.tfvars`. |
| H3 | Secrets are read from environment variables, never hard-coded. | Code reads keys through `backend/app/config.py` settings or env vars. No key-shaped string literals in `backend/`, `frontend/`, `infra/` or `scripts/`. |
| H4 | Only data the team may use. **No personal, client, confidential or social media data.** | Every dataset or API the code calls is public (e.g. agency GTFS feeds) or a licensed API. No real people's names, addresses or phone numbers in fixtures or sample data. |
| H5 | A list of **every public data source** used, with links. | A "Data sources" section in the root `README.md` (proposed location; the rule doesn't say where) names each feed or API the code actually calls. Compare it with the code: every URL or feed in the code appears in the list. |
| H6 | Every AI tool and model used is recorded, **coding assistants included**. | The root `README.md` "AI tools used" section names each one with what it did. Currently known: Claude (research, docs, scaffolding), IBM Bob (idea review), IBM Granite `ibm/granite-4-h-small` (in the product). Add any other tool the team used. |
| H7 | Work is backed up to GitHub before the hackathon cloud accounts close. | All branches meant for submission are pushed: `git status -sb` shows nothing ahead of `origin`. |
| H8 | The Lovable discount code stays out of the repo (the keynote asked teams to keep it in the room). | It doesn't appear in any file or commit. |

## S. Submission deliverables

Source: the workbook's "Submission checklist" and `google-doc/03-tech-resources.md` "Pitch and submission".

| ID | Requirement | Check |
|---|---|---|
| S1 | **Problem statement**, one sentence: *[User] struggles to [task] because [reason], which costs them [impact].* | Written for the commute check (not the BusPulse sample) in the repo and in the Google Doc workbook. The repo copy can be checked; the Google Doc is CAN'T VERIFY. |
| S2 | **Solution / value proposition**, one sentence: *For [user], [project] is a [type of tool] that [key benefit], unlike [existing solution], which [falls short how].* | Same as S1. |
| S3 | **IBM and/or Google tools listed, with what each one does** in the app. | A stack table in the root `README.md` names each tool and its job, and matches the code. Example: Granite on watsonx.ai writes X; Code Engine hosts the app. |
| S4 | **One-minute demo video** on a public link (YouTube unlisted is fine). It shows the product working, not slides. | The link is in the root `README.md`. CAN'T VERIFY its content. |
| S5 | The team lead submits **before 6:00 PM ET**. | CAN'T VERIFY from the repo. |
| S6 | The pitch is rehearsed and timed. Confirm the presentation length with the organizers. | CAN'T VERIFY. |

## J. Judging criteria (5 points each, 25 total)

Source: the keynote, recorded in `README.md` (this folder) and `google-doc/03-tech-resources.md`. The organizers published the criteria only, not a rubric for each point. The **What earns it** column is the organizers' advice and the team's research, not the official scoring.

| ID | Criterion | What earns it | Check |
|---|---|---|---|
| J1 | Completeness and feasibility, **including how clearly IBM technology is applied** | The demo works end to end on the deployed app. **Granite makes a visible decision or produces a visible output** in the product, not just rewording text at the end. A smoke-test endpoint doesn't count. | A product endpoint (not `/api/granite/ask`) calls Granite, and its output appears in the UI as its own labeled element. The deployed URL answers `/api/health`. |
| J2 | Creativity and innovation | A verdict on the **round trip against a specific shift**, which trip planners don't give. | The verdict covers the trip there and the trip home separately, for the user's shift times. |
| J3 | Design and usability | The four Design for AI questions are answered: what the AI does for the user, where a human stays in control, what happens when the AI is wrong, how the app earns trust. The UI shows why it reached a verdict. | The UI shows the risk factors behind each verdict. A risky or no verdict always shows a next step (see P2). The Design for AI answers are written for the commute check. |
| J4 | Effectiveness and efficiency | It uses real schedule data, or sample data that is clearly labeled. Answers come back quickly. | Sample or hard-coded data is labeled as sample in the UI or README. The team has an honest answer ready for "is this data live?" |
| J5 | Michigan impact: keeping value, jobs and opportunity in Michigan | Workers reach jobs at Michigan employers; employers fill shifts. The employer view strengthens this. | The pitch or README states the Michigan impact using figures from `google-doc/02-research-report.md`. |

## P. Product guardrails (team decisions in `why-we-are-building-this.md`)

| ID | Requirement | Check |
|---|---|---|
| P1 | "Reliable" means a **schedule-based risk score**, and the product says so. No claims of live or real-time data. | No UI text or docs claim live bus positions. The risk score uses published schedules and published on-time rates. |
| P2 | A **risky or no verdict always comes with a next step**: a different shift, MichiVan vanpool or SMART Flex, each marked for whether it covers that shift. | Every risky or no response from the API includes at least one backup option. |
| P3 | Out of scope: **live bus tracking, real bookings for vanpools or shuttles, a job board.** | None of these exist in the code. Backup options are information and links only. |
| P4 | **No invented statistics.** Every figure in the UI, README or pitch traces to a source in `google-doc/02-research-report.md`. Check that report's table of which figures are safe to quote. | Each number in user-facing text matches the research report. Anything else is marked as an assumption. |
| P5 | Say "we found no tool that does this," never "no tool like this exists." | No user-facing text or pitch material claims nothing like it exists. |
| P6 | Build and demo for **one specific person**: a Detroit worker without a car on a second shift (3:00 to 11:30 PM) at a plant in Warren or Sterling Heights. | The demo walks through this person's case. |

## K. Keynote advice (not scored directly)

- Build for one specific person, not everyone.
- Talk to someone who has the problem before writing code.
- Scope small. Finished beats fancy.
- Demo the thing itself, not slides about it.
- Pitch your thinking out loud, including what you didn't solve. Name exactly which IBM and Google tools do what.

## Before the repo goes public

- `docs/google-doc/*` link to the team's Google Doc. Once the repo is public, anyone can open that doc if its link sharing is on. Check its sharing setting, or remove the links.
- `docs/README.md` links to a private design mockup. That's harmless, but judges can't open it.
