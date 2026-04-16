# ============================================================
# YOOM AI — COMPLETE SETUP GUIDE & HANDOVER
# ============================================================

## WHAT WAS BUILT IN THIS UPDATE

### 1. Terminal Amber on True Black color scheme
- `tailwind.config.ts` — full new palette
- `globals.css` — entire app re-themed
- Every component updated with amber theme and Lucide icons

### 2. All emoji replaced with Lucide React icons
- Sidebar, MobileNav, HomeCard, MeetingRoom, polls, quiz, alerts
- No emoji anywhere in the codebase

### 3. Hardcoded "12:30 PM" replaced
- Hero pill now queries Supabase for the real next upcoming lecture
- Shows actual time and title, or "No upcoming lectures scheduled"

### 4. Feedback page (/feedback)
- 4 categories: Bug report, Feature idea, Experience, Lecture quality
- 5-star rating, subject, details
- Saves to Supabase `feedback` table
- Rate limited + Zod validated

### 5. Admin dashboard (/admin) with password login
- Dedicated login page at /admin/login
- Password-based authentication (no Clerk required)
- Secure HTTP-only cookie, 24-hour session
- Rate limited: max 5 attempts per minute per IP
- 5 admin pages: Overview, Users, Lectures, Feedback, AI Training Queue

---

## ════════════════════════════════════════════════
## HOW TO LOG IN AS ADMIN — READ THIS CAREFULLY
## ════════════════════════════════════════════════

### Step 1 — Set your admin password in .env.local

Open your `.env.local` file and add this line:

```
ADMIN_SECRET_PASSWORD=YourStrongPasswordHere
```

Choose any password you want. Make it strong.
Example: `ADMIN_SECRET_PASSWORD=Yoom@Admin2024!`

That is the ONLY setup required.

### Step 2 — Go to the admin login page

Visit: http://localhost:3000/admin/login
(or https://your-app.vercel.app/admin/login after deployment)

### Step 3 — Enter your password

Type the password you set in Step 1 and click
"Access admin dashboard".

### Step 4 — You are in

You will be redirected to /admin and stay logged in for 24 hours.
After 24 hours the session expires and you need to log in again.

### Logout

Click "Logout" in the top-right of any admin page.

### If you forget your password

Change `ADMIN_SECRET_PASSWORD` in `.env.local` to a new value
and restart the server. Old sessions will still work for 24 hours
unless you also restart (which clears them).

### Security notes

- The password is NEVER stored in the database
- The session cookie is HTTP-only (JavaScript cannot read it)
- The cookie is only sent over HTTPS in production
- There is a rate limit of 5 wrong attempts per minute per IP
- After 5 wrong attempts you are locked out for 1 minute
- Never share or commit your ADMIN_SECRET_PASSWORD to git

---

## ════════════════════════════════════════════
## FULL SETUP CHECKLIST
## ════════════════════════════════════════════

### STEP 1 — Create accounts

| Service     | URL                        | Free tier |
|-------------|----------------------------|-----------|
| Clerk       | https://clerk.com          | Yes       |
| Stream      | https://getstream.io       | Yes       |
| Supabase    | https://supabase.com       | Yes       |
| Inngest     | https://app.inngest.com    | Yes       |
| Wit.ai      | https://wit.ai             | Free      |
| OpenRouter  | https://openrouter.ai      | Pay-as-go |
| Upstash     | https://upstash.com        | Yes       |

---

### STEP 2 — Run Supabase schema

1. Go to supabase.com → your project → SQL Editor
2. Paste the entire contents of SUPABASE_SCHEMA.sql
3. Click Run
4. Verify all tables appear in Table Editor

---

### STEP 3 — Train Wit.ai

Follow WIT_AI_SETUP.md to train all 7 intents.
Required for voice-to-action features in the meeting room.

---

### STEP 4 — Set up .env.local

```bash
cp .env.example .env.local
```

Fill in every value. Required variables:

```
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-...
WIT_AI_TOKEN=...
OPENROUTER_API_KEY=sk-or-...
ADMIN_SECRET_PASSWORD=YourStrongPasswordHere
UPSTASH_REDIS_REST_URL=https://...  (optional)
UPSTASH_REDIS_REST_TOKEN=...        (optional)
```

---

### STEP 5 — Install and run

```bash
npm install
npm run dev
```

Visit http://localhost:3000

---

### STEP 6 — Test admin login

1. Go to http://localhost:3000/admin/login
2. Enter your ADMIN_SECRET_PASSWORD
3. You should be redirected to /admin dashboard

---

### STEP 7 — Deploy to Vercel

```bash
npm install -g vercel
vercel
```

In Vercel dashboard → Settings → Environment Variables,
add EVERY key from your .env.local including ADMIN_SECRET_PASSWORD.

Then register Inngest:
Inngest dashboard → Apps → Add App
→ https://your-app.vercel.app/api/inngest

---

### STEP 8 — Test the role system

- User A creates meeting → automatically becomes lecturer (amber badge)
- User B joins via link → automatically becomes participant
- No Clerk dashboard setup needed for roles

---

## ARCHITECTURE RULES

1. Creator of meeting = Lecturer. Checked via lectures.lecturer_id in Supabase.
2. Admin = anyone who knows ADMIN_SECRET_PASSWORD. Session via HTTP-only cookie.
3. All API routes are Zod-validated, rate-limited, role-checked server-side.
4. supabaseAdmin is server-only. Never import in client components.
5. Inngest handles all async workflows.

---
Built with: Next.js 14 · TypeScript · Clerk · Stream Video SDK · Supabase
           Inngest · Wit.ai · OpenRouter · Excalidraw · Upstash Redis
           Zod · Lucide React
