# Project docs

Context for anyone, human or coding agent, picking up this repo. Read `why-we-are-building-this.md` first.

These files are a snapshot of the team's Google Doc ("MDevFest") taken on **November 13, 2026, about 12:10 PM ET**. The Google Doc stays the source of truth. If something here disagrees with it, the Google Doc wins and this folder needs a refresh.

## What we are building

A shift-aware commute check for the Michigan DevFest AI Hackathon 2026 (Mobility track, team of three). A worker without a car enters a job's location and shift, and the app answers whether they can make the round trip by bus, shows why, and offers a backup plan when the answer is no.

## Files

| File | What it is |
|---|---|
| `why-we-are-building-this.md` | The reason for the project: the person, the problem, the evidence, what the product does and does not do. Start here. |
| `google-doc/01-hackathon-workbook.md` | The organizers' team workbook. **Its filled-in answers are sample text about a different app ("BusPulse"), not ours.** See the warning at the top of that file. |
| `google-doc/02-research-report.md` | Research on Michigan mobility problems, with sources, a comparison of candidate problems, the data and APIs available, and which statistics are safe to quote. |
| `google-doc/03-tech-resources.md` | Platforms, credits, deadlines, judging criteria and getting-started links for IBM watsonx, Google Cloud and Lovable. |
| `google-doc/04-business-model-canvas.md` | The nine-block business model canvas for the commute check. |

## Status

### Done

- **Problem research.** Five lines of research were combined into one report (`google-doc/02-research-report.md`). Its conclusion is that getting to work without a car in Metro Detroit is the strongest problem for this team.
- **Business model canvas.** Filled in for the commute check (`google-doc/04-business-model-canvas.md`). Revenue streams and partners are assumptions, not validated.
- **Screen mockup.** Four screens (check a job, verdict, backup plan, employer view) on a design canvas outside this repo: https://claude.ai/artifact/5b4XhRDYymMx57VXg4EkXb. The link is private to its owner unless shared. Bus times, margins and applicant counts in it are sample data.
- **Repo created.** `google_ibm_hack_26` on GitHub, with a README and these docs. No application code yet.

### Deadline

Submissions close at **6:00 PM ET on November 13, 2026**, with pitches at 6:30 PM and winners at 7:30 PM. Aim to submit at 5:45 PM. The IBM competition page separately lists Sunday, November 15 at 2:00 PM ET; the team treats that as a backstop only if an organizer confirms it.

### Not decided yet

- **Tech stack.** The workbook's "Our stack" section is empty. `google-doc/03-tech-resources.md` leans toward a Lovable front end (React, TypeScript, Tailwind, shadcn/ui), a Python API on Google Cloud Run, and IBM Granite through the watsonx Python SDK, and advises skipping watsonx Orchestrate unless several agents are needed. None of this is a decision.
- **Product name.** The mockup uses "Commute Check" as a placeholder.
- **Who the pitch says it is for.** Proposed, not agreed: build and demo for one Detroit worker, and describe the benefit as reaching any Michigan worker without reliable transportation. See `why-we-are-building-this.md`.
- **Workbook answers.** The problem statement, value proposition, Design for AI answers, team roles, judging map, build plan, video script and pitch in the workbook have not been written for the commute check.

### Not verified yet

These came out of the research as open risks. Check each one before building on it.

- Whether Google's transit routing returns DDOT and SMART trips late at night (for example, leaving a plant at 11:30 PM). Nobody has run a test query.
- Which IBM Granite model IDs the team's hackathon account has enabled.
- The current DDOT on-time figures. The research had January 2026 numbers only.

## Rules that apply to this repo

From the organizers' workbook and keynote:

- The repo must be public for submission. Never commit API keys or other secrets. Use environment variables.
- Use only data the team is allowed to use. No personal, client, confidential or social media data. Keep a list of every public data source.
- Record which AI tools and models were used, including coding assistants. Judges ask. So far: the research, the canvas, the mockup and these docs were produced with Claude.
- Hackathon cloud accounts close after the event. Push code to GitHub before then.

## Judging

Five criteria, 5 points each, 25 total:

1. Completeness and feasibility, including how clearly IBM technology is applied
2. Creativity and innovation
3. Design and usability
4. Effectiveness and efficiency
5. Michigan impact: keeping value, jobs and opportunity in Michigan
