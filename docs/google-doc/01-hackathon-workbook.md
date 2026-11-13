<!-- Exported from the team Google Doc "MDevFest", tab "How to Win a Hackathon", on 2026-11-13 around 12:10 PM ET.
     Source: https://docs.google.com/document/d/1JfQvlIcYmX3VJww7KUwIZINZ9PYFhvXmoMTAL6vWr4Q/edit?tab=t.0
     The Google Doc is the source of truth; this file is a snapshot. -->

> **Warning for readers and agents:** the filled-in answers in this workbook ("OUR ANSWER", "OUR PROBLEM STATEMENT", "OUR VALUE PROPOSITION", the Design for AI answers, the repo and video URLs, the submission time) describe **BusPulse**, a bus-capacity tracker for commuting students. That is sample text, not this team's project. The repo URL and video URL in it are not real. Our project is the shift-aware commute check described in `../why-we-are-building-this.md`. The guidance text, checkpoints, rules and submission checklist in this workbook do apply to us.

# How to Win a Hackathon

*Team workbook. Research it, build it, pitch it.*

**Michigan DevFest + AI Hackathon** · November 13, 2026 · Hollywood Casino Hotel at Greektown, Detroit

*From The Better Hackathon Playbook · the-better-hackathon.github.io/playbook*

### How to use this workbook

- **Make a copy:** One person makes a copy for the team (File > Make a copy) and shares it with every teammate.
- **Fill in ✏️ sections:** Replace the “Type here” text with your answers.
- **Work top to bottom:** Find the problem, research it, plan and build, then pitch and submit.
- **Reuse content:** Your problem statement, pitch, video script, and submission all come from these sections.

**Tip:** Finish sections 01 and 02 before 11:00 AM. Teams that lock the problem early build faster all afternoon. The ✏️ sections are the ones your team fills in; the others are guidance. Keep this doc open all day and update it as your idea changes.

### Event Details & Guidance

*Register, claim your credits, and note the deadlines.*

**Cloud Credits Note:** Claim Google Cloud credits at the start of the day because there is a claim window. Google credits don’t cover AI Studio billing; use Vertex AI or Antigravity. Lovable’s code must be redeemed before the event ends and checkout must be in USD; ask an organizer for the code.

### ✏️ Your Team

*Assign roles, not tasks. One person can hold two roles on a small team.*

The team lead also requests your team’s IBM Cloud account on [ibm.biz/midevfest26](http://ibm.biz/midevfest26) and submits at the end. Write everyone’s name and the email they used on the IBM platform.

## 01 · Find the Problem

*Pick one real person and one real problem. Everything else gets easier.*

**Checkpoint:** Aim to finish this section by 11:00 AM. The Design for AI workshop at 10:00 will help you sharpen it.

#### ✏️ Who’s the user?

Name one real person or role. What does their day look like? What frustrates them? Be specific: *“a first-year student who commutes by bus,”* not “students.”

**OUR ANSWER**

First-year university students who commute by campus and city buses daily to reach morning classes on time.

*A specific user makes every later answer easier, and judges always ask who it’s for. If you can, talk to someone like this person today.*

#### ✏️ Why does this matter?

What happens if nobody solves this? Who is affected, how many people, and how often?

**OUR ANSWER**

Buses arrive fully loaded during peak hours without warning, causing commuters to miss classes, suffer unnecessary transit stress, and waste hours waiting for subsequent buses.

*This becomes the first 20 seconds of your pitch. Think about scale and frequency: how many people, how often, and what it costs them in time, money or stress.*

#### ✏️ Why do we care?

Why does your team care about this problem? Has anyone on the team lived it? Judges only get as excited as you are.

**OUR ANSWER**

Several team members are daily bus commuters in Michigan who have personally experienced missing critical lectures due to unexpected overcrowding.

*A personal connection is the most memorable part of any pitch. If someone on the team lived this problem, that story is your opener.*

#### ✏️ Our problem statement

**Template:** *[User] struggles to [task] because [reason], which costs them [impact].*

**OUR PROBLEM STATEMENT**

**Commuting students** struggle to know when the next bus is full because **there is no real-time capacity data**, which causes them to **be late for class and lose productive time**.

*Example: Commuting students struggle to know when the next bus is full because there’s no live capacity data, which makes them late for class.*

*One sentence that pulls the last three sections together. Your submission and your pitch both start here. If the team can’t agree on this sentence, keep talking before you build.*

## 02 · Research the Idea

*Find out how big the problem is, what already exists, and where you can do better.*

**Judges Tip:** Judges will ask what already exists. Spend 20 to 30 minutes here before you build.

#### ✏️ What’s the impact?

Find two data points that show how big this problem is: one for scale, one for cost or pain. Always note the source.

*Two numbers is the sweet spot for a pitch. Use a real source and keep the link: judges notice. Never invent a statistic; if you can’t find one, say what you’d measure instead.*

#### ✏️ What already exists?

List apps, tools or services people use today, and where each one falls short for your user: cost, access, speed, trust, language?

*Something almost always exists. That’s good news: it proves the problem is real and shows you the gap. The gap you find here is your opportunity.*

#### ✏️ How we do it better

**Template:** *For [user], [our project] is a [type of tool] that [key benefit], unlike [existing solution], which [falls short how].*

**OUR VALUE PROPOSITION**

For commuting students, **BusPulse** is a real-time capacity tracker that predicts passenger loads and suggests alternate routes, unlike standard transit apps which only show static schedules.

*This one sentence is your value proposition. You’ll reuse it in the pitch, the submission and the video. Tie it back to your user and the gap you found.*

#### ✏️ Design for AI

*Tech is impressive. Tech that fits real human needs is impactful.*

**WHAT DOES AI DO FOR OUR USER?**

Predicts real-time bus passenger loads and generates dynamic rerouting options based on historical stop data and live passenger counts.

**WHERE DOES A HUMAN STAY IN CONTROL?**

The user chooses whether to wait for the next bus, walk, or select an alternative route suggested by the system.

**WHAT HAPPENS WHEN THE AI IS WRONG?**

Displays confidence intervals for capacity predictions and allows riders to manually report current bus fullness to override erroneous AI estimates.

**HOW DO WE EARN THE USER’S TRUST?**

By providing transparent source data, confidence scores, and crowd-sourced validation from fellow commuters in real time.

*Fill this in during or right after the 10:00 Design for AI workshop with Hoda Solati, Shima Solati and Roland Frohman III. Judges love a team that can say how their AI fails safely and how the user stays in charge. More:* [ibm.com/design/ai/team-essentials](http://ibm.com/design/ai/team-essentials)

## 03 · Plan and Build

*Design toward the judging criteria, pick your stack, and hit your checkpoints.*

**Strategy:** Use the IBM workshop at 11:00 and the Google workshop at noon to pick your stack. Then build toward the one thing your demo must show.

#### ✏️ Map your project to the judging

Write in each criterion the organizers announce, then how your project shows it. Teams who design toward the rubric win more often.

*Common criteria include impact, technical execution, use of AI and sponsor tools, design and user experience, and presentation. Use the criteria announced today, not these examples.*

#### ✏️ Our stack

Name each tool and what it does in your app. You’ll need this list for your submission.

*Keep this updated as you build. When the pitch asks how it works, read straight from this table: which IBM and Google tools you used and what each one does.*

#### ✏️ Build plan and checkpoints

Mark each checkpoint as you hit it.

*Write the one thing your demo must show at the top of your notes and protect it. Cut everything else until that works end to end.*

#### Tech and data rules

- **Data:** Use only data you’re allowed to use. No personal information, client data, confidential data or social media data. Keep a list of every public source.
- **Secrets:** Never commit API keys to your repo. Use environment variables, and rotate any key you accidentally pushed.
- **AI tools:** Note which AI tools and models you used, including coding assistants. Judges will ask.
- **Back up:** Hackathon cloud accounts close after the event. Push your code to GitHub and export anything you want to keep.

*These rules protect you and your users. A project that breaks them can be disqualified, so check them before you submit.*

## 04 · Pitch and Submit

*Show it working, say it out loud, and submit before 6:00 PM.*

**Timeline:** Start this section by 5:00 PM. Record your video by 5:30 and submit by 5:45.

#### ✏️ One-minute demo video script

Plan what you say and show at each beat.

**VIDEO LINK**

[https://youtube.com/watch?v=buspulse-demo](https://youtube.com/watch?v=buspulse-demo)

*Record your screen with a voiceover. Show the product working, not slides. The video is also your backup if the live demo breaks at 6:30. Upload it with a public link (YouTube unlisted works) and paste the link here.*

#### ✏️ Our three-minute pitch

Assign a speaker and a key line for each part.

*Pitch your thinking out loud, including what you didn’t solve. Judges reward thinking they can hear. Practice out loud at least twice and time it. Lead with the person you built for, show it working live, name exactly which IBM and Google tools do what, and end with who it helps next. Pitch deck outline:* [ibm.biz/pitch-deck-outline](http://ibm.biz/pitch-deck-outline)*. Confirm today’s presentation length with the organizers and adjust the times.*

#### ✏️ Submission checklist

**Submit by 6:00 PM.**

- Problem and solution statements written
- IBM and/or Google tools listed, with what each does
- Public GitHub repo, no API keys inside
- One-minute demo video uploaded
- Team lead submitted before 6:00 PM
- Pitch rehearsed and timed

**REPO URL**

[https://github.com/midevfest2026/bus-pulse](https://github.com/midevfest2026/bus-pulse)

**VIDEO URL**

[https://youtube.com/watch?v=buspulse-demo](https://youtube.com/watch?v=buspulse-demo)

**SUBMITTED AT (TIME)**

5:45 PM ET

*Aim to submit at 5:45 PM. Wi-Fi gets slow right before a deadline, and 6:00 PM is a hard close. Presentations start at 6:30 PM and winners are announced at 7:30 PM.*

## Resources

#### Data

- **Hugging Face Datasets:** [huggingface.co/datasets](http://huggingface.co/datasets)
- **Michigan Open Data:** [data.michigan.gov](http://data.michigan.gov)

#### AI Tools

- **IBM watsonx & Granite:** [ibm.com/watsonx](http://ibm.com/watsonx)
- **Gemini on Vertex AI:** [cloud.google.com/vertex-ai](http://cloud.google.com/vertex-ai)
- **Lovable:** [lovable.dev](http://lovable.dev)

#### Design & Pitch

- **IBM Design for AI:** [ibm.com/design/ai/team-essentials](http://ibm.com/design/ai/team-essentials)
- **Pitch Deck Outline:** [ibm.biz/pitch-deck-outline](http://ibm.biz/pitch-deck-outline)
- **The Better Hackathon Playbook:** [the-better-hackathon.github.io/playbook](http://the-better-hackathon.github.io/playbook)

*Also useful: developer.ibm.com for IBM tutorials and huggingface.co/models for open models.*

**Figure it out, out loud.**

**Submissions close 6:00 PM · Demos 6:30 PM · Winners 7:30 PM**

*Good luck today. Keep this workbook after the event: it’s a ready-made portfolio write-up of what you built and why.*
