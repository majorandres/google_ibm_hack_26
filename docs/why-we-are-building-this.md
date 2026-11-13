# Why we are building this

Written November 13, 2026. Every figure below comes from `google-doc/02-research-report.md`, which has the full sourcing and a table of which statistics are safe to quote.

## The short version

A job offer is a months-long commitment. A Detroit worker without a car has no way to find out, before saying yes, whether the commute will hold up in both directions at the hours the shift demands. Trip planners answer one trip at a time. We are building the tool that answers the job question: take it, ask for a different shift, or line up a ride before day one.

## The person

A Detroit resident without a car who has been offered a second-shift job (3:00 PM to 11:30 PM) at a plant in Warren or Sterling Heights. Getting to work at 3:00 PM by bus is usually possible. Getting home at 11:30 PM, after service thins out, is where the commute fails. That return trip is the part existing tools do not check.

## The problem, with evidence

- **Many Detroiters have no car.** 21% of Detroit households have no vehicle, against 7% in Michigan and 8% nationally. 36% of Detroiters are transportation insecure, about double the national rate of 17%. ([Planet Detroit, Nov 2025](https://planetdetroit.org/2025/11/transportation-insecurity-detroit-research/))
- **The jobs are outside the city.** Nearly 70% of employed Detroit residents work outside Detroit. ([Axios Detroit, Sept 2025](https://www.axios.com/local/detroit/2025/09/29/detroit-residents-commuter-wage-gap))
- **Transit does not reach most of them.** The regional transit authority found Detroiters can reach 13% of all jobs in the three-county area, and about 21% of entry-level jobs, within a 60-minute transit trip at peak. 27 of 40 high-need Detroit census tracts cannot reach any suburban job cluster. At 11 PM, access to major job sites such as Stellantis Jefferson North and Amazon Fairgrounds falls by about half. ([RTA Detroit Workforce Mobility Equity Report](https://www.rtamichigan.org/app/uploads/2025/06/RTA-Detroit-Workforce-Mobility-Equity-Report-F-1.pdf))
- **The buses that exist are unreliable.** DDOT's dashboard for January 2026 showed 68% on-time performance in the morning and 62% in the afternoon, against a goal of 85%. ([DDOT Performance Dashboard](https://detroitmi.gov/taxonomy/term/5641))
- **Employers feel it too.** A 2024 state survey found transportation was the most pressing barrier to workforce participation in all 16 Michigan Works! regions. ([Michigan LEO](https://www.michigan.gov/leo/news/2025/12/18/new-playbook-helps-employers-tackle-transportation-barriers-to-strengthen-retention-and-productivity))

## Why now

Wayne County voters ended the suburban transit opt-out system on August 4, 2026, with 67% support ([Transportation Riders United](https://www.detroittransit.org/?p=21965)). SMART is adding eight new routes and five extensions in phases from September 2026 through 2029. Which jobs are reachable will keep changing for three years, and nobody tracks that job by job. A tool that reads the published schedules stays current as each new route arrives.

## What the product does

1. **Check a job.** The worker enters the job's address, their shift, their work days and where they are leaving from.
2. **Give a verdict.** Yes, risky or no for the round trip, with the trip there and the trip home shown separately.
3. **Show why.** A risk score built from the schedule: number of transfers, how long the wait is if a bus is missed, the margin between clock-out and the last bus home, and the agency's published on-time rate.
4. **Offer a backup plan** when the answer is risky or no: a different shift, a MichiVan vanpool, or SMART Flex on-demand service, each marked for whether it covers that shift.
5. **Employer view** (second audience): for a plant's shift times, how many applicants without a car can make the round trip, and what changes if a shift ends 30 minutes earlier.

## Two conditions the research set

- **"Reliable" means a schedule-based risk score, and the product says so.** Live bus positions cannot be obtained in a one-day build: DDOT lists no public real-time feed, and SMART's requires an application with no stated turnaround. The score uses published schedules and published on-time rates.
- **A "no" must come with a next step.** A verdict alone does not get anyone to work.

## What we are not building

- Live bus tracking.
- Real bookings for vanpools or shuttles. The backup options are information and links.
- A job board. No open Michigan job-listings feed was found, so the user enters the job's address and shift, or picks from a small list of sample jobs.

## How this differs from what exists

The Transit app and Google Maps plan one trip at a time. LinkedIn shows a commute estimate on job listings. In about a dozen searches, the research found no tool that checks both directions against a specific shift, returns a verdict, and adds fallbacks. Say "we found no tool that does this," not "none exists."

## Michigan impact

The hackathon scores "keeping value, jobs and opportunity in Michigan." The case: workers reach jobs at Michigan plants and warehouses that they would otherwise turn down or lose, and Michigan employers fill shifts they cannot staff now.

Proposed framing, not yet agreed by the team: build and demo for one Detroit worker, and describe the reach as any Michigan worker without reliable transportation. The workforce survey above covers all 16 regions of the state, and Grand Rapids, Ann Arbor and Flint publish the same kind of open schedule data as Detroit, so adding a city means loading another feed.

## Draft problem statement

Draft only. The team has not agreed on this sentence, and the workbook asks for one.

> A Detroit worker without a car struggles to know whether a job's shift is reachable by bus in both directions, because trip planners answer one trip at a time and not the trip home after a late shift, which costs them jobs they turn down needlessly or accept and then lose.
