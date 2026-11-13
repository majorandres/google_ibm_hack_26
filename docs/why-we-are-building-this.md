# Why we are building this

Written November 13, 2026. This is the one-page version. The full problem statement, with sources, is [`../michigan-accessible-transit-problem-statement.md`](../michigan-accessible-transit-problem-statement.md). Every figure below is in `seed_data.json → evidence[]` with its URL.

## The short version

When a paratransit or Medicaid ride fails, the rider has a phone call and a memory. The agency has the data. RideRecord gives the rider their own dated record, turns it into a complaint addressed to the office that has to answer it, and adds the records up so advocates can see patterns without relying on what agencies report about themselves.

## The person

"Denise" (fictional) lives in Detroit, uses a wheelchair, and depends on paratransit to get to medical appointments. The ride there usually comes. The ride back is the one that fails: late, or never. When she calls, she is told to call someone else.

## The problem, with evidence

- **About 1 in 5 people in Michigan have a disability.** In Detroit that is more than 128,000 residents. Rideshare is not required by federal law to be accessible, so paratransit and Medicaid rides are often the only option.
- **Detroit paratransit has a long complaint history.** Years of missed pickups and long waits, a fight over a ~$50M contract in 2022, emergency contracts in 2023, and a federal warning about funding.
- **It is improving, and the data is self-reported.** DDOT launched same-day "DDOT Now" in June 2025 and says each provider is at least 98% on time. That figure comes from the agency.
- **Medicaid rides fail with no one owning it.** In 2026 a Farmington Hills man in a powered wheelchair missed nearly a dozen appointments. The ride company pointed to its contractors; the insurer cited privacy rules. A prior state audit found the Medicaid ride system not effective, and a new audit covering $160.5M in spending is due in late 2026.
- **Federal law bans the pattern, not the single failure.** 49 CFR 37.131(f) prohibits patterns of substantial numbers of untimely pickups, missed trips, denials and excessively long trips. It does not define "substantial". The FTA's complaint form asks for dates and times, which is what RideRecord collects.

## What the product does

1. **Ride log.** Log a trip by tapping, or by saying what happened.
2. **Complaint builder.** Pick logged problems; get a draft letter addressed to the right office, with the days left to file. The rider reviews it and sends it.
3. **Reliability dashboard.** Late, missed and denied trips by provider and month, with a "possible pattern" flag.

## What it does not do, and what we do not claim

- **It does not send complaints.** AI drafts; the rider sends. Every draft says it is not legal advice.
- **It does not fix the root causes.** Those are funding and labor. Software cannot add drivers or wheelchair vans. It can change information, documentation and accountability.
- **The dashboard is demo data.** Synthetic trips for fictional providers, labeled on screen. Real agency names never appear next to synthetic numbers.
- **A flag is not a finding.** The threshold is our assumption. We say "possible pattern, worth investigating", never "violation".
- **Nobody has been interviewed yet.** The original plan starts with 8 to 10 rider interviews. The hackathon build replaces that with cited reporting. Interviews are the first step after today.
- **Location is ZIP-level at most; no diagnoses.** Today's build collects neither.

## Who it is for

Built and demoed for one rider, Denise. The benefit reaches riders and caregivers across Michigan, and the advocates who speak for them: Disability Rights Michigan, Transportation Riders United, Warriors on Wheels of Metro Detroit and the Disability Network centers. None of them has seen it yet.
