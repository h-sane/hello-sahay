# CLAUDE.md — Hello Sahay

Guidance for Claude Code (and teammates) working in this repository. The global
`~/.claude/CLAUDE.md` governs *how* to work; this file wins on project specifics.

## What this project is

**Hello Sahay** is a free, multilingual (Tamil, Hindi, English) AI voice helpline
for rural patients: it finds nearby government and private facilities, checks
PM-JAY / CMCHIS scheme coverage, books appointments and sends WhatsApp
confirmations. **Sahay Desk** is the paid hospital dashboard; **Sahay** is the
patient app.

- Built for **Founder's Code 2026** (24-hour hackathon, SMIT Chennai, 14–15 Oct
  2026), Tech + Business track, domain Rural Healthcare.
- Full product, business and technical brief: [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md).
  Its section 11 (decision log) is the source of truth for product decisions.
- Business model in one line: patients never pay; small private hospitals pay
  ₹2,999/month for Sahay Desk plus ₹40 per helpline patient who actually arrives.

## Current state

Phase 0 done 2026-10-14: folder skeleton (each folder's README names its task
cards), local Postgres + pgvector, `.env.example`, GitHub milestones and one
issue per task card. Voice (2026-10-14): `services/voice` runs the English/Hindi/Tamil call pipeline behind a browser page (:8002) and the phone bridge (Twilio/Exotel); verified with synthetic speech in all three languages, not yet with a real phone call. Update this section as code lands.

**Local setup:** `docker compose up -d` (Postgres on host port **5433**), copy
`.env.example` to `.env`, then `python scripts/check_setup.py` (needs boto3 and
psycopg or psycopg2) to confirm DB, Bedrock, embeddings, Polly and Transcribe.

**AWS: personal account only.** Use `AWS_PROFILE=personal-bedrock` (account
654780359658, `ap-south-1`). The machine's default profile is the Nirmaan
company account and must never be used here. On the personal account, Amazon
Nova (`apac.amazon.nova-lite-v1:0`, `apac.amazon.nova-pro-v1:0`) and Titan
embeddings v2 work on credits; Claude models on Bedrock fail with
INVALID_PAYMENT_INSTRUMENT (Marketplace, needs a card).

## Planning docs (read before building)

| Doc | What it holds |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System diagram, journeys, citation rule, data model, API contract, data sources, team split |
| [`docs/PATIENT_APP_SPEC.md`](docs/PATIENT_APP_SPEC.md) | Every patient-app feature, free vs Care plan, design rules |
| [`docs/IMPLEMENTATION_PHASES.md`](docs/IMPLEMENTATION_PHASES.md) | Phase 0/1/2 task cards with "done when", checkpoints, demo script |
| [`docs/FRONTEND_DELIVERABLES.md`](docs/FRONTEND_DELIVERABLES.md) | Screens to design for the patient app, Sahay Desk and admin |
| [`docs/PRODUCT_FEATURES.md`](docs/PRODUCT_FEATURES.md) | Every feature per app (helpline, patient app, Desk, admin, `/call`) with tier and task card |
| [`docs/BUSINESS.md`](docs/BUSINESS.md) | Business decisions: who pays, pricing, go-to-market, competitors, jury answers, open questions |

## Team and tools

- Hussain plans and evaluates with Claude (Opus). Claude owns architecture,
  reviews, docs and hard bugs.
- Gemini / Antigravity implement and research, working from the task cards in
  `docs/IMPLEMENTATION_PHASES.md`. Review their commits against the API
  contract in `docs/ARCHITECTURE.md` §5.
- One teammate designs screens in Google AI Studio; output lands in
  `design/ai-studio/` as a visual reference only.

## Hackathon rules that shape how we work

1. **Commit early and often, with clear messages.** Judges inspect GitHub
   history and give the most weight to work done during the event. Never
   squash or rewrite history.
2. **Show what existed before the event.** Anything pre-existing (AI Studio UI
   prototype, templates, copied code) goes in its own clearly-named commit
   (e.g. `chore: import AI Studio UI prototype (pre-event reference)`).
3. **Build the core ourselves.** Do not use a ready-made agent platform (Vapi,
   Bolna) as the core voice pipeline; ready-made tools earn less credit.
4. **Keep it modular.** The jury releases surprise challenges at 7 PM, midnight
   and 6 AM. New requirements must slot in without rewrites.
5. **P0 end to end before P1.** Tiers and the demo script are in
   `docs/PROJECT_BRIEF.md` §8. Feature freeze at 6 AM Thursday.

## Safety guardrails (hard requirements, never relax)

- **No AI diagnosis, treatment advice or autonomous medical decisions.** The LLM
  only quotes government advisories (RAG, with the source named) and calls
  deterministic tools (search, booking, coverage lookup).
- **Emergency detector runs before the LLM** (keywords + classifier in all three
  languages). On a match: say "Call 108 / 112", offer human transfer, log it.
- Symptom questions or low retrieval confidence → fixed safe reply ("visit your
  nearest PHC / call 108"), offer to book, or hand off to a human.
- Medicine feature: same composition, strength and form generics only, from the
  Jan Aushadhi list, always with "confirm with your doctor or pharmacist".
- Free government options are shown before private ones.
- **Privacy (DPDP Act):** consent line at call start, transcripts only (no audio
  stored by default), minimal personal data, no secrets or real patient data in
  the repo. Seed data is clearly labelled DEMO DATA.

## Repository map (planned; see brief §7.2)

| Path | Role |
|---|---|
| `apps/patient/` | Expo React Native patient app |
| `apps/web/` | Next.js: `/desk` hospital dashboard, `/admin` our console, `/call` browser "Call Sahay" demo |
| `design/ai-studio/` | AI Studio screen exports (visual reference, pre-event commit) |
| `services/api/` | FastAPI: facilities, slots, bookings, schemes, advisories RAG |
| `services/voice/` | WebSocket voice pipeline: Transcribe → safety gate → Bedrock tools → TTS |
| `data/seed/` | Demo district data (DEMO DATA) |
| `data/advisories/` | Government advisory sources with issuer, URL, date |
| `docs/` | Project brief, proposals, architecture notes |
| `.claude/handoffs/` | Session handoffs (gitignored) |

## Stack

FastAPI + PostgreSQL/pgvector · Next.js · Expo · AWS Bedrock (LLM) · Amazon
Transcribe (Hindi/English speech-to-text) · Amazon Polly (Hindi/English speech) ·
Sarvam (Tamil speech-to-text `saarika:v2.5` and text-to-speech `bulbul:v3`;
verified 2026-10-14, ₹100 free credit) · WhatsApp Cloud API · AWS Mumbai region. Secrets live in
`.env` files that are never committed; one shared `.env.example` at the
root lists every variable.

## Git workflow (Claude manages this, no confirmation needed)

Hussain does not manage git here; Claude does, every session, without being asked.

1. Work on the `development` branch. `main` is never committed to directly.
2. **Commit checkpoints proactively**, one logical change per commit, message
   explains why. Don't leave finished work uncommitted across a session
   boundary, and push after committing so teammates and judges see it.
3. Merge `development` → `main` at verified checkpoints (builds, tests pass).
   Normal merge or fast-forward only; never force-push or rewrite `main`.
4. If branches diverge unexpectedly (a teammate pushed), stop and surface it.
5. This overrides the global "commit/push only when asked" default for this repo.

## Multi-agent setup (several Claude sessions run at once)

Hussain runs several Claude Code sessions in parallel on this same folder, and
teammates push from their own machines. Sessions must coordinate so they never
overwrite each other.

1. **Board first.** At the start of every session, read
   `.claude/coordination/BOARD.md` (local, gitignored) and run `ListAgents` to
   see the other live sessions. Ask them with `SendMessage` if anything is
   unclear.
2. **Claim before editing.** Add a row to the board: your session name, the
   task card (from `docs/IMPLEMENTATION_PHASES.md`), the folders/files you own,
   and the start time. Never start on a card or folder another row has claimed.
3. **Stay in your scope.** Edit only the files you claimed. Shared files
   (`CLAUDE.md`, `docs/ARCHITECTURE.md` API contract, `docker-compose.yml`, root
   `.gitignore`, `.env.example` files) need a message to the other sessions
   first, and the edit stays small and focused.
4. **Shared working tree, careful git.** All local sessions share one checkout.
   Stage only your own paths (`git add <paths>`, never `git add -A` or
   `git commit -a`). Never `stash`, `reset`, `checkout --` or `clean` files you
   didn't write. Before pushing, run `git pull --rebase`; on a conflict in
   someone else's file, stop and message them.
5. **Announce changes others depend on.** Changing an API shape, env var, port
   or table: update the doc and `SendMessage` the sessions that use it.
6. **Release when done.** Mark your board row done with the commit hash, and
   write your handoff. Session numbers for handoffs are claimed on the board
   too, so two sessions never write the same `session_NN`.
7. Teammates on other machines coordinate through GitHub issues
   (one issue per task card, assigned to whoever is on it).

## Session handoffs (mandatory, every session)

**Every session ends with a handoff.** This is not a judgment call for this
project: the team works in many short sessions across a 24-hour event, and
context must never be lost.

- **Every response, not just the session end:** each session ends every turn by
  updating its own handoff (append a `### HH:MM update` section) or creating it,
  so other agents always see what each session is doing right now.
- Talk to other sessions with `SendMessage` (names from `ListAgents`), never by
  editing their files. The orchestrator session (Opus) assigns cards and edits
  the plan; implementers report back to it when a card is done.
- Location: `.claude/handoffs/` (gitignored).
- Naming: `YYYY-MM-DD_session_<NN>.md`, numbered continuously across the whole
  project (`session_01`, `session_02`, …).
- Top of file: `Session date: YYYY-MM-DD, HH:MM local` and a link to the
  previous handoff by relative path.
- Contents: summary of work, files modified, architectural decisions (with
  why), new dependencies, commands run, problems and attempted solutions,
  pending tasks, next steps, implementation notes, assumptions, known bugs,
  testing status (verified vs. unverified, stated plainly).
- On "continue where we left off": read the newest handoff completely and
  continue from exactly that state.

## Engineering rules

- Small single-purpose modules; split a file before it grows past ~300–400 lines.
- Reuse before writing; no unnecessary dependencies.
- Verify end to end the way a judge would see it (real flow, visible result)
  before calling anything done; say plainly what was and wasn't verified.
- Docs are part of the change: update `README.md` and this file when how the
  project runs or what users see changes.
- UI work: invoke `frontend-design:frontend-design` first; simple, minimal,
  classy, large text and high contrast (rural, low-end Android users).
