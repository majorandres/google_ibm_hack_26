<!-- Exported from the team Google Doc "MDevFest", tab "Tech Resources", on 2026-11-13 around 12:10 PM ET.
     Source: https://docs.google.com/document/d/1JfQvlIcYmX3VJww7KUwIZINZ9PYFhvXmoMTAL6vWr4Q/edit?tab=t.9qo8bfx0zk6a
     The Google Doc is the source of truth; this file is a snapshot. -->

# Tech Resources

*Platforms, credits and getting-started links for Michigan DevFest Hackathon 2026.*

### Deadlines and judging

Tonight is the operative deadline. The keynote states submissions close at 6:00 PM ET today, presentations and judging at 6:30 PM, winners at 7:30 PM. Aim to submit at 5:45 PM. The IBM platform separately lists Sunday Nov 15 at 2:00 PM ET; treat that as a backstop only if an organizer confirms it.

Judging is 25 points, 5 each: completeness and feasibility (includes how clearly IBM technology is applied), creativity and innovation, design and usability, effectiveness and efficiency, and Michigan impact.

- Competition page: [compete.112601.watsonx-challenge.ibm.com/competitions/midevfest](https://compete.112601.watsonx-challenge.ibm.com/competitions/midevfest)

### IBM watsonx — the scored platform

Judges score how clearly IBM technology is applied, so Granite should be making a visible decision in the product, not just rephrasing text at the end. Start in Prompt Lab in the browser to see what Granite does, then move to the Python SDK.

- Team account and credits: [ibm.biz/midevfest26](https://ibm.biz/midevfest26) — claim window, do this first
- watsonx.ai: [ibm.com/products/watsonx-ai](https://ibm.com/products/watsonx-ai)
- Granite models: [ibm.com/granite](https://ibm.com/granite)
- Granite 4.0 docs: [ibm.com/granite/docs/models/granite4-0](https://ibm.com/granite/docs/models/granite4-0)
- Getting started tutorial: [developer.ibm.com/tutorials/awb-getting-started-watsonx-ai/](https://developer.ibm.com/tutorials/awb-getting-started-watsonx-ai/)
- Python SDK: [ibm.github.io/watsonx-ai-python-sdk/](https://ibm.github.io/watsonx-ai-python-sdk/)
- Granite recipes and notebooks: [github.com/ibm-granite-community/granite-kitchen](https://github.com/ibm-granite-community/granite-kitchen)
- Granite on Ollama, offline fallback: [ollama.com/ibm/granite4](https://ollama.com/ibm/granite4)
- IBM Design for AI: [ibm.com/design/ai/team-essentials](https://ibm.com/design/ai/team-essentials)

Granite Guardian is a safety and trust evaluation model. Running outputs through it is a cheap, concrete answer to the “what happens when the AI is wrong” question.

watsonx Orchestrate is for multi-agent workflows and its toolkit needs Python 3.11+ and Docker. Skip it unless the idea genuinely needs several agents coordinating.

### Google Cloud — the plumbing

The services that matter here: Cloud Run for the API, Vertex AI for Gemini, Cloud Storage, Pub/Sub for event streaming, and BigQuery for analytics. Credits do not cover AI Studio billing, so use Vertex AI.

- Join the credits group: [groups.google.com/g/michigandevfest26hack](https://groups.google.com/g/michigandevfest26hack)
- Then claim credits: [g.dev/credits/michigan-devfest-hackathon](https://g.dev/credits/michigan-devfest-hackathon)
- Vertex AI: [cloud.google.com/vertex-ai](https://cloud.google.com/vertex-ai)
- Antigravity and Cloud Run codelab: [codelabs.developers.google.com/build-and-deploy-gcp-with-antigravity](https://codelabs.developers.google.com/build-and-deploy-gcp-with-antigravity)

Antigravity is Google's agent-first dev tool. It can plan the architecture, write the gcloud setup scripts and deploy a Python Cloud Run service, which is useful if nobody on the team has used GCP before.

### Lovable — the front end

Generates React with TypeScript, Tailwind and shadcn/ui, with a Supabase backend for Postgres, auth and storage. Exports to GitHub. The backend is Supabase-coupled, so the model work stays on IBM or GCP and Lovable calls out to those endpoints.

- [lovable.dev](https://lovable.dev)
- Supabase: [supabase.com](https://supabase.com)

Pro Plan 1 gives 100 credits and every prompt spends some, so sketch the screens before prompting. The code must be redeemed before the event ends and checkout must be in USD; ask an organizer for the code.

### Data sources

- Michigan open data: [data.michigan.gov](https://data.michigan.gov)
- Hugging Face datasets: [huggingface.co/datasets](https://huggingface.co/datasets)
- Hugging Face models: [huggingface.co/models](https://huggingface.co/models)

For transit specifically, agencies publish GTFS and GTFS-Realtime feeds. Check the individual Detroit-area agency sites for their feed URLs rather than assuming one exists.

### Pitch and submission

- Pitch deck outline: [ibm.biz/pitch-deck-outline](https://ibm.biz/pitch-deck-outline)
- The Better Hackathon Playbook: [the-better-hackathon.github.io/playbook](https://the-better-hackathon.github.io/playbook)

Submission needs a public GitHub repo with no API keys in it, a one-minute demo video on a public link, and the IBM and Google tools listed with what each one does.

### Setup — do this first

From the keynote. All four should be done before 10:00 AM.

**IBM**

- Register and form your team at [ibm.biz/midevfest26](https://ibm.biz/midevfest26), signing in with the email you will use all day
- Team lead requests the pre-configured IBM Cloud account from the Complete the hackathon page; every teammate accepts the Join now email
- Already have IBM Cloud? Switch to the hackathon account in the account menu, top right
- Start the IBM Bob free trial: [bob.ibm.com/trial](https://bob.ibm.com/trial)

The account includes $100 in IBM Cloud credits, watsonx.ai Prompt Lab and Granite models, watsonx Orchestrate, Code Engine, Cloudant and IBM Bob. Accounts close after the hackathon, so export your work before you leave.

**Google Cloud**

- Join the group first, using a personal @gmail.com account: [groups.google.com/g/michigandevfest26hack](https://groups.google.com/g/michigandevfest26hack)
- Claim the credits and join the Google Developer Program: [g.dev/credits/michigan-devfest-hackathon](https://g.dev/credits/michigan-devfest-hackathon)
- Claim your badge and finish phone verification
- Wait 2 to 5 minutes, then create a Cloud project on the credits billing account

**Lovable**

- Go to [lovable.dev](https://lovable.dev), then Settings, then Plans and Credits
- Select Pro Plan 1 (100 credits) on the monthly plan
- Discount code: [left out of this export because this repo is public and the keynote asked teams to keep the code inside the room; it is in the Google Doc]
- Check that checkout is in USD. Already paid? Create a new workspace.

### If you get stuck

- CRED-101: switch to a personal Gmail account
- CRED-103: refresh, retry, or use mobile data
- No IBM Cloud email: check spam, then ask your team lead
- Lovable currency issue: community@lovable.dev
- Still stuck: raise your hand

### Five rules from the keynote

- Build for one specific person, not everyone.
- Talk to someone who has the problem before you write code.
- Scope small. Finished beats fancy, every time.
- Demo the thing itself, not slides about it.
- Pitch your thinking out loud, including what you didn't solve.

### Today's schedule

- 10:00 AM — Design for AI Workshop, with Hoda Solati, Shima Solati and Roland Frohman III
- 11:00 AM — Build with AI Workshop by IBM, with Michael Mati
- 12:00 PM — Build with AI Workshop by Google, with Justin Beaudry
- 1:00 PM — Lunch and networking
- 2:00 PM — Hacking continues
- 6:00 PM — Submissions close, hard deadline
- 6:30 PM — Presentations, demos and judging
- 7:30 PM — Winners, awards and prizes

### Event links

- Keynote slides: [ibm.biz/midevfest26-keynote](https://ibm.biz/midevfest26-keynote)
- Original workbook: [ibm.biz/win-midevfest26](https://ibm.biz/win-midevfest26)
