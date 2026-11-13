# RideRecord (working name)
### Problem Statement, Solution, and Build Plan — Accessible Transportation in Michigan

*Draft v1 · November 2026 · Author: Esteban Garcia Taquez*

---

## TL;DR

Michigan riders with disabilities who depend on paratransit and Medicaid ride services face missed pickups, late rides, wrong vehicles, and stranded return trips, and when it happens, there is no simple way to document it. Individual complaints get lost between transit agencies, ride brokers, contractors, and health plans, and the patterns that federal law prohibits stay invisible because the only data comes from the agencies themselves.

**RideRecord** is an accessible web app and SMS line that lets riders log each trip in seconds, turns those logs into ready-to-file complaints for the right agency, and gives disability advocates anonymized, rider-sourced data on service reliability.

---

## 1. The Problem

### 1.1 Who is affected

- About **1 in 5 people in Michigan have a disability** (Disability Rights Michigan).
- In Detroit alone, **more than 128,000 residents** have at least one disability.
- Northern Michigan has a **larger share of older and disabled residents** than most rural areas in the U.S., which means more people who rely on transit.
- Rideshare companies like Uber are **not required by federal law to be wheelchair accessible**, so for many riders, public paratransit and Medicaid rides are the only options.

### 1.2 Where the system breaks down

**Detroit paratransit.** Riders and advocates complained for years about missed pickups, long waits, and poor customer service. A ~$50M contract with Transdev was fought over in 2022. In 2023, with paratransit facing a shutdown, the mayor used emergency short-term contracts with four local companies. The federal government also warned the city that it was violating federal law by not fully funding the service. Things are improving: DDOT now offers a same-day option, "DDOT Now," but availability is limited.

**Gaps between providers.** Southeast Michigan's 2025 *Mobility 4 All* regional plan found that **85% of trips stay inside a single county**. Riders run into gaps in communities that opted out of transit and long waits where different providers meet, and they want standardized eligibility across the region. As of May 2025, streamlining paratransit transfers between DDOT and SMART was still listed as an outstanding item.

**Medicaid medical rides (NEMT).** A state audit found Michigan's Medicaid non-emergency transportation system **not effective**. In March 2026, a Farmington Hills man in a powered wheelchair reported missing **nearly a dozen doctor's appointments** so far that year due to:
- last-minute cancellations,
- vans that couldn't fit his wheelchair,
- a return ride that never came.

When he complained, the ride broker pointed him to its third-party providers and his insurer, and the insurer declined to comment, citing privacy rules. **No one owned the failure.**

**Rural Michigan.** In a 2025 study of rural Iosco County, **26%** of respondents reported disrupted medical care due to transportation problems, and **9.5%** had care delayed or canceled outright. Regional plans in West Michigan describe services for seniors and people with disabilities as so heavily used that needs go unmet.

### 1.3 The specific gap this project targets

Federal ADA regulations (**49 CFR §37.131(f)**) prohibit paratransit "capacity constraints," which include operational patterns producing **substantial numbers of**:
- significantly untimely pickups (initial or return trips),
- trip denials or missed trips,
- trips with excessive trip lengths.

Excessive phone hold times for booking are also treated as a capacity constraint.

But **"substantial" is not defined**, and the data used to judge compliance comes almost entirely from **the agencies and brokers themselves**. Meanwhile, riders' experiences live in phone calls, memory, and scattered complaints that are often unreported or ignored. Small and rural agencies frequently **can't afford to run customer evaluations at all**.

> **Problem statement:**
> Riders with disabilities in Michigan who depend on paratransit and Medicaid rides have no easy, accessible way to document service failures. As a result, individual complaints get lost between agencies, contractors, and health plans, and the patterns of missed and late trips that federal law prohibits go unproven.

### 1.4 What this project does *not* try to solve

The root causes are mostly **funding and labor**. Detroit's DDOT bus drivers start at ~$19/hr versus ~$27/hr at SMART, driving turnover, and Detroit's per-capita transit investment trails 38 other U.S. metro regions. Software can't add wheelchair vans or drivers. This project focuses on what software *can* change: **information, documentation, and accountability**.

---

## 2. The Solution

### 2.1 What RideRecord is

An **accessibility-first web app (PWA) plus an SMS line** with three layers:

| Layer | What it does | Who it serves |
|---|---|---|
| **1. Ride Log** | Log a trip's outcome in under 30 seconds: on time, late (by how much), no-show, wrong vehicle, denied, excessively long ride, long booking hold | Riders, caregivers |
| **2. Complaint Builder** | Turns one or more logged incidents into a pre-filled complaint for the right channel (e.g., DDOT ADA complaint, SMART, Medicaid health plan grievance, FTA Office of Civil Rights), with filing deadlines tracked. The rider reviews and sends it; nothing goes out automatically. | Riders, caregivers |
| **3. Reliability Dashboard** | Anonymized, aggregated reliability data by provider and service area, with minimum group sizes so no individual can be identified | Advocates (TRU, DRM, Disability Networks), agency advisory councils, journalists |

### 2.2 MVP features

- **Phone-number sign-in** (one-time code), with no passwords to remember
- **Quick log**: big-button flow, ≤3 taps per trip
- **SMS logging**: text `OK`, `LATE 40`, `NOSHOW`, or `WRONGVAN` to a number, no smartphone required
- **Caregiver mode**: a family member or aide can log on a rider's behalf, with the rider's permission
- **Ride history**: a timeline of trips and incidents, exportable to PDF/CSV
- **Complaint drafts**: generated from selected incidents, using templates reviewed by an advocacy partner
- **Deadline reminders**: e.g., DDOT investigates ADA complaints received within 180 days of the incident

### 2.3 Incident types (mapped to federal criteria)

| Incident | Maps to §37.131(f) |
|---|---|
| Late pickup (minutes beyond window) | Untimely pickups |
| Late/missed return trip | Untimely pickups (return) |
| No-show (vehicle never arrived) | Missed trips |
| Trip denied at booking | Trip denials |
| Ride took excessively long | Excessive trip lengths |
| Long hold time when booking | Operational pattern limiting availability |
| Wrong/inaccessible vehicle | Service failure (documented separately) |
| Driver conduct / safety | Service failure (documented separately) |

### 2.4 Accessibility requirements (non-negotiable)

Because the users are people with disabilities, accessibility is the product, not a feature:
- WCAG 2.2 AA compliance as a release gate
- Tested with **VoiceOver (iOS)** and **TalkBack (Android)**, plus keyboard-only navigation
- Large touch targets, high contrast, no time limits on forms
- Plain language (target ~6th–8th grade reading level)
- SMS path for riders without smartphones or with limited dexterity
- Usability testing with real riders before each release

---

## 3. Purpose — Why This Solution

1. **Make individual failures count.** A missed ride today is usually a phone call that disappears. A logged ride is a timestamped record the rider owns and can use.
2. **Turn anecdotes into evidence.** Federal law prohibits *patterns* of missed and late trips, and patterns require data. Rider-sourced logs give advocates an independent data set that doesn't rely on agency self-reporting.
3. **Close the accountability gap.** When a broker blames its contractor and the insurer cites privacy, a complaint addressed to the right channel, with dates and details attached, is much harder to bounce around.
4. **Help agencies, too.** DDOT now reports ≥98% on-time performance for its paratransit providers. Rider data can confirm that, which is good news worth amplifying, or show where it isn't true for specific trip types like return rides.
5. **No agency permission needed to launch.** Unlike a trip planner, which depends on agency data feeds and eligibility rules, RideRecord works from day one with only riders.
6. **Aligned with the region's direction.** The *Mobility 4 All* plan explicitly calls for better trip planning tools and modernized scheduling software, and rider-side reliability data supports that work.

### Success metrics

| Stage | Metric | Target |
|---|---|---|
| Validation | Rider/caregiver interviews completed | ≥ 8 |
| Validation | Interviewees who say they'd log rides weekly | ≥ 5 |
| Pilot | Active riders | ≥ 15 |
| Pilot | Riders logging ≥1 trip/week for 4 weeks | ≥ 60% |
| Pilot | Median time to log a trip | < 30 seconds |
| Pilot | Complaints filed through the app | ≥ 5 |
| Impact | Advocacy partners using dashboard data | ≥ 1 |

---

## 4. Alternatives Considered

| Option | Why not first |
|---|---|
| **Cross-provider trip planner** (knows eligibility rules and transfer points across DDOT, SMART, dial-a-rides) | High value, but depends on agency data and hand-curated eligibility rules; overlaps with existing services like MyRide2 and Disability Rights Michigan's statewide transportation guide. Strong **Phase 2** candidate once RideRecord shows where riders get stuck. |
| **Feedback tool for small/rural agencies** | Useful, but requires agency buy-in to start, and agencies are the slowest stakeholder to move. Could be a later spin-off of the dashboard. |

---

## 5. Action Plan

*Assumes ~8–10 hrs/week alongside school. Week 1 = week of Nov 16, 2026; adjust around finals and breaks.*

### Phase 0 — Validate (Weeks 1–3)
**Goal:** Confirm riders actually want to log rides, and pick a pilot scope.
- [ ] Contact **Disability Rights Michigan**, **Transportation Riders United**, and a local **Disability Network** center; ask for a 20-min call and introductions to riders
- [ ] Attend a **DDOT Local Advisory Council** or DDOT monthly community input meeting (riders and advocates attend these)
- [ ] Interview 8–10 riders/caregivers: How do you book? What goes wrong? What do you do when it does? Would you log rides? SMS or app?
- [ ] Collect the **actual complaint channels and forms** (DDOT, SMART, 1–2 Medicaid health plans/brokers, FTA)
- [ ] Decide pilot scope (likely: **Detroit/Wayne County: DDOT + SMART paratransit + one Medicaid ride broker**)

**Exit criteria:** ≥5 interviewees say they'd use it weekly, plus at least one advocacy partner willing to review complaint templates. If not, revisit the alternatives in §4.

### Phase 1 — Design (Weeks 4–5)
- [ ] Finalize the data model (see §6) and incident taxonomy
- [ ] Write the privacy model: what's stored, what's shared, retention, deletion
- [ ] Low-fidelity prototypes of the quick-log flow and SMS commands
- [ ] Test prototypes with 3 riders (including at least one screen-reader user)
- [ ] Write an ADR for the stack decision

### Phase 2 — MVP Build (Weeks 6–10)
**Suggested stack** (matches existing experience):
- **Frontend:** React PWA (installable, works on low-end phones)
- **Backend:** Python + FastAPI
- **Database:** PostgreSQL (Cloud SQL)
- **Hosting:** GCP Cloud Run
- **SMS + OTP:** Twilio (or similar)
- **Testing:** pytest, Playwright, axe-core for automated accessibility checks in CI

**Build order:**
- [ ] Auth (phone OTP) and rider profile
- [ ] Quick-log flow (web)
- [ ] SMS logging (inbound webhook → parse command → create trip/incident)
- [ ] Ride history timeline and PDF/CSV export
- [ ] Caregiver mode (delegated access with rider consent)
- [ ] Accessibility audit: axe-core in CI plus manual VoiceOver/TalkBack pass

### Phase 3 — Complaint Builder (Weeks 11–12)
- [ ] Templates per channel (DDOT ADA, SMART, Medicaid plan grievance, FTA)
- [ ] Have templates **reviewed by the advocacy partner** (not legal advice; the app helps riders file, it doesn't file for them)
- [ ] Deadline tracking and reminders (SMS)
- [ ] Rider review-and-send flow: nothing is submitted automatically

### Phase 4 — Pilot (Weeks 13–17)
- [ ] Recruit 15–20 riders through the partner organization
- [ ] Onboarding session (in person or by phone) for those who want it
- [ ] Weekly check-ins; track the success metrics in §3
- [ ] Fix the top usability issues every two weeks

### Phase 5 — Reliability Dashboard (after pilot)
- [ ] Aggregate incidents by provider, service type, and month
- [ ] Suppress any group below a minimum size (e.g., fewer than 5 riders) to prevent re-identification
- [ ] Publish methodology alongside the data (self-reported, timestamped, limitations)
- [ ] Share the first report with the advocacy partner and DDOT's Local Advisory Council

### Later
- Cross-provider trip navigator (§4)
- Expand beyond Southeast Michigan (Grand Rapids, Lansing, rural dial-a-ride agencies)
- Open-source the codebase and hand long-term ownership to a partner organization

---

## 6. Data Model (Sketch)

```
Rider
  id, phone (hashed lookup), display_name?, home_area (ZIP/neighborhood, NOT address),
  providers[], sms_opt_in, caregiver_ids[], created_at

Provider
  id, name, type (ADA paratransit | Medicaid NEMT | dial-a-ride),
  region, complaint_channels[], complaint_deadline_days

Trip
  id, rider_id, provider_id, direction (outbound | return),
  scheduled_window_start, scheduled_window_end,
  actual_pickup?, actual_dropoff?, logged_at, logged_via (web | sms | caregiver)

Incident
  id, trip_id, type (late_pickup | no_show | trip_denied | excessive_length |
                     long_hold | wrong_vehicle | driver_conduct | other),
  minutes_late?, notes?, created_at

Complaint
  id, rider_id, incident_ids[], channel, status (draft | sent | acknowledged | resolved),
  deadline, sent_at?, response_notes?
```

**Privacy rules baked into the model:**
- No diagnoses or medical details; trip purpose is optional and coarse ("medical," "work," "errand")
- No street addresses, only ZIP or neighborhood
- Encrypted at rest; riders can export or delete everything at any time
- No data sales, ever; aggregate data only above minimum group sizes

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Riders are already overburdened; logging is one more chore | ≤30-second logs, SMS option, caregiver mode, log only the bad trips if preferred |
| Self-reported data is questioned by agencies | Timestamp at log time, encourage real-time logging, publish methodology, never overclaim |
| Trip data reveals sensitive info (home, medical visits) | ZIP-level location only, optional coarse trip purpose, encryption, minimum group sizes |
| Riders fear retaliation or losing service | Individual complaints only when the rider chooses; dashboard is anonymized; explain clearly what's shared |
| Complaint templates read as legal advice | Templates reviewed by advocacy partner; clear "not legal advice" notice; rider sends, not the app |
| Accessibility failures exclude the target users | WCAG 2.2 AA gate, automated plus manual screen-reader testing, rider usability sessions |
| Student-project sustainability | Partner org co-ownership from Phase 0; open source; low hosting costs on Cloud Run |
| Scope creep into a full trip planner | Navigator is explicitly deferred until pilot data shows it's needed |

---

## 8. Open Questions

1. Which pilot scope do partners care about most: Detroit paratransit, Medicaid rides, or a rural dial-a-ride?
2. Do riders prefer SMS or an app? (Validate in Phase 0, don't assume.)
3. Which complaint channels accept email or online submission vs. paper/phone only?
4. What format do advocates want the data in: dashboard, CSV, or quarterly report?
5. Would DDOT or SMART be open to receiving aggregated rider data directly?

---

## Sources

- [Metromode — New website simplifies search for accessible public transportation in Michigan](https://metromodemedia.com/?p=25893)
- [Metro Times — Detroit launches same-day paratransit service](https://www.metrotimes.com/news/detroit-launches-same-day-paratransit-service-after-years-of-complaints-and-disruption-39672600/)
- [CBS Detroit — Detroit mayor pledging to help disabled who need rides](https://www.cbsnews.com/detroit/news/detroit-mayor-pledging-to-help-disabled-who-need-rides)
- [RTA — Mobility 4 All Executive Summary (Dec 2025)](https://www.rtamichigan.org/app/uploads/2026/01/RTA-M4A-Executive-Summary_12152025_ADA.pdf)
- [RTA — Mobility 4 All Community Engagement Summary](https://www.rtamichigan.org/app/uploads/2025/10/AppE2_Summer_CommunityEngagement_508_10172025.pdf)
- [RTA — Mobility 4 All / MyRide2](https://www.rtamichigan.org/?p=144)
- [DDOT Local Advisory Council minutes, May 2025](https://detroitmi.gov/sites/detroitmi.localhost/files/2025-06/Local%20Advisory%20Council%20May%2020%202025%20LAC%20Meeting%20Minutes.pdf)
- [DDOT — ADA Fixed Route Accessibility & complaint procedure](https://detroitmi.gov/taxonomy/term/6646)
- [FOX 47 — Audit finds MDHHS non-emergency transportation system ineffective](https://www.fox47news.com/neighborhoods/state-capitol/audit-finds-mdhhs-non-emergency-transportation-system-ineffective)
- [ClickOnDetroit — Farmington Hills man with disabilities stranded for doctor's visits (Mar 2026)](https://www.clickondetroit.com/news/local/2026/03/24/medical-transportation-failures-leave-farmington-hills-man-with-disabilities-stranded-for-doctors-visits)
- [Michigan Journal of Public Health — NEMT deficiencies in Iosco County (2025)](https://scholarworks.gvsu.edu/mjph/vol12/iss1/5)
- [Newaygo County Transit Study (2026)](https://www.newaygocountymi.gov/wp-content/uploads/2026/06/Final-Newaygo-County-Transit-Study-Accessible.pdf)
- [TRU — Rural Transit fact sheet](https://www.detroittransit.org/wp-content/uploads/2025/05/Rural-Transit-Transit-is-Essential.docx.pdf)
- [TRU — 2025 Detroit Transit Policy Platform](https://www.detroittransit.org/wp-content/uploads/2025/05/2025-Detroit-Transit-Policy-Platform.pdf)
- [MDPI — Impacts of Local Transit Systems on Vulnerable Populations in Michigan](https://mdpi.com/2413-8851/7/1/16)
- [Michigan Public — Medicaid pays millions for patient transportation; sometimes the ride never comes](https://www.michiganpublic.org/2022-01-12/medicaid-pays-millions-for-patient-transportation-sometimes-the-ride-never-comes)
- [49 CFR §37.131 — Service criteria for complementary paratransit](https://ecfr.io/Title-49/Section-37.131)
- [National Academies — ADA paratransit capacity constraints (incl. phone hold times)](https://nap.nationalacademies.org/read/24766/chapter/8)
