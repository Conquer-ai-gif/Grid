# ============================================================
# GRID — WHAT WAS BUILT & WHAT YOU NEED TO DO
# ============================================================

## WHAT I BUILT

### Architecture
Event-driven, server-authoritative system:
Client → API Routes → Inngest → Supabase (persistent truth)
                   → Stream Events (real-time sync)

### New Files Added

#### Types
- `types/index.ts` — All TypeScript types for the entire platform

#### Library
- `lib/supabase.ts` — Supabase client (anon + admin/service role)
- `lib/openrouter.ts` — OpenRouter AI engine with prompt templates
- `lib/ratelimit.ts` — Upstash Redis rate limiting for all API routes
- `lib/utils.ts` — Updated with debounce, throttle, compression helpers

#### Inngest Workflows
- `inngest/client.ts` — Inngest client
- `inngest/handle-intent.ts` — Routes Wit.ai intents: poll, quiz, homework, summarize, record, mute
- `inngest/lecture-summary.ts` — Aggregates transcripts → calls OpenRouter → saves summary
- `inngest/attendance-tracker.ts` — Tracks join/leave events, calculates duration
- `inngest/index.ts` — Exports all functions

#### API Routes (all validated with Zod, rate-limited, role-enforced)
- `app/api/inngest/route.ts` — Inngest serve endpoint
- `app/api/wit/route.ts` — Speech-to-intent, saves transcript, fires Inngest
- `app/api/polls/route.ts` — Create polls (lecturer only) + get polls
- `app/api/polls/vote/route.ts` — Vote on polls (server-authoritative, deduped)
- `app/api/quizzes/route.ts` — Create AI-generated quizzes (lecturer only)
- `app/api/quizzes/respond/route.ts` — Submit quiz answers (deduped)
- `app/api/attendance/route.ts` — Record join/leave, view attendance (lecturer only)
- `app/api/lectures/route.ts` — Create + list lectures
- `app/api/lectures/transcript/route.ts` — Get transcript chunks for replay
- `app/api/ai/route.ts` — Q&A and summarization via OpenRouter
- `app/api/whiteboard/route.ts` — Save + replay whiteboard events
- `app/api/roles/route.ts` — Assign roles (lecturer-protected)

#### Hooks
- `hooks/useWitAI.ts` — Debounced speech intent hook
- `hooks/useDataSaver.ts` — Data saver toggle + network quality detection
- `hooks/useOfflineQueue.ts` — Offline event queue with auto-sync
- `hooks/useAttendance.ts` — Auto-tracks join/leave on mount/unmount
- `hooks/useRole.ts` — Returns user role from Clerk publicMetadata

#### Components
- `components/DataSaverToggle.tsx` — Toggle button for data saver mode
- `components/polls/PollWidget.tsx` — Live voting UI with progress bars
- `components/polls/QuizWidget.tsx` — Timed quiz UI with countdown
- `components/whiteboard/Whiteboard.tsx` — HTML5 canvas whiteboard (touch + mouse, batch sync)
- `components/ai/LectureAssistant.tsx` — Floating AI chat assistant
- `components/analytics/EngagementDashboard.tsx` — Stats: attendance, polls, quiz scores
- `components/MeetingRoom.tsx` — Rebuilt with: data saver, whiteboard, polls, focus mode, AI assistant, auto layout switching

#### Pages
- `app/(root)/(home)/analytics/page.tsx` — Lecturer analytics dashboard
- `app/(root)/(home)/courses/page.tsx` — Course listing
- `app/(root)/(home)/replay/page.tsx` — Lecture replay: transcript, summary, whiteboard

#### Config
- `SUPABASE_SCHEMA.sql` — Complete database schema (run in Supabase SQL editor)
- `.env.example` — All required environment variables with instructions
- `WIT_AI_SETUP.md` — Step-by-step Wit.ai training guide
- `middleware.ts` — Updated to protect all new routes
- `constants/index.ts` — Sidebar updated with Courses, Replay, Analytics
- `next.config.mjs` — Updated for Excalidraw + Inngest compatibility
- `package.json` — All new dependencies added

---

## WHAT YOU NEED TO DO

### STEP 1 — Create accounts (all free tiers available)

| Service | URL | What you need |
|---|---|---|
| Clerk | https://clerk.com | Publishable key + Secret key |
| Stream | https://getstream.io | API key + Secret key |
| Supabase | https://supabase.com | Project URL + Anon key + Service role key |
| Inngest | https://app.inngest.com | Event key + Signing key |
| Wit.ai | https://wit.ai | Server access token (see WIT_AI_SETUP.md) |
| OpenRouter | https://openrouter.ai | API key + Add credits ($5 is plenty to start) |
| Upstash | https://upstash.com | Redis REST URL + Token (OPTIONAL - disables rate limiting if missing) |

---

### STEP 2 — Set up Supabase database

1. Go to https://supabase.com → Create new project
2. Go to SQL Editor → New Query
3. Paste the ENTIRE contents of `SUPABASE_SCHEMA.sql`
4. Click "Run"
5. Confirm all tables are created in Table Editor

---

### STEP 3 — Configure Wit.ai

Follow the full guide in `WIT_AI_SETUP.md`.
Key: train all 7 intents before testing voice commands.

---

### STEP 4 — Set up Inngest

1. Go to https://app.inngest.com → Create account
2. Create new app called "grid"
3. Copy Event Key and Signing Key
4. After deploying to Vercel, go to Inngest → Apps → Add App
5. Enter your Vercel URL + /api/inngest (e.g. https://your-app.vercel.app/api/inngest)

---

### STEP 5 — Set up OpenRouter

1. Go to https://openrouter.ai → Create account
2. Go to Keys → Create API Key
3. Add at least $5 credit (lectures use ~$0.001 per summary)
4. Default model used: mistralai/mistral-7b-instruct (very cheap)

---

### STEP 6 — Create .env.local

```bash
cp .env.example .env.local
```
Then fill in ALL values from the services above.

---

### STEP 7 — Set user roles in Clerk

Every user needs a role assigned BEFORE they can access role-gated features.

**Option A — Clerk Dashboard (recommended for now):**
1. Go to https://clerk.com → Your App → Users
2. Click on a user → Metadata
3. In publicMetadata add: `{ "role": "lecturer" }` or `{ "role": "participant" }`

**Option B — API route (after first lecturer is set):**
```bash
POST /api/roles
{ "user_id": "user_xxx", "role": "participant" }
```
(Must be called by a user with role: "lecturer")

---

### STEP 8 — Install dependencies and run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

### STEP 9 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all .env.local values as Vercel Environment Variables.
Then register your Vercel URL with Inngest (Step 4 above).

---

## ARCHITECTURE RULES (DO NOT BREAK THESE)

1. **Client is NEVER the source of truth.** All votes, attendance, transcripts go through API routes.
2. **Inngest handles all async workflows.** Don't put long-running logic in API routes.
3. **supabaseAdmin is server-only.** Never import it in client components.
4. **useRole() gates UI.** But API routes ALSO enforce roles server-side — both layers always.
5. **All API routes use Zod validation.** Never skip this.

---

## TESTING CHECKLIST

- [ ] Sign in as lecturer → see Analytics, Courses in sidebar
- [ ] Create a course and lecture
- [ ] Join a meeting → attendance auto-tracked
- [ ] Toggle Data Saver → camera disables
- [ ] Open Whiteboard panel → draw something
- [ ] Open AI Assistant (blue robot button) → ask a question
- [ ] Lecturer creates a Poll → participants see it and vote
- [ ] Lecturer creates a Quiz → participants get timer and submit answer
- [ ] After lecture ends → go to /replay?lecture_id=xxx → see transcript
- [ ] Go to /analytics?lecture_id=xxx → see engagement stats

---

## KNOWN LIMITATIONS / FUTURE WORK

- Whiteboard sync via Stream custom events (real-time broadcasting) needs Stream custom event setup in your Stream dashboard
- Wit.ai speech is triggered manually via API — integrate with browser SpeechRecognition API for auto-transcript
- Excalidraw integration is available as a package but not yet wired in — replace Whiteboard canvas with Excalidraw for richer drawing
- Semantic search over transcripts currently uses keyword matching — upgrade to pgvector in Supabase for true semantic Q&A
- Upstash Redis is optional but strongly recommended for production rate limiting

---
Built with: Next.js 14, TypeScript, Clerk, Stream Video SDK, Supabase, Inngest, Wit.ai, OpenRouter, Upstash Redis, Zod
