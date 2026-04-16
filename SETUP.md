# Yoom AI — Setup Guide

Everything you need to do before the app works. Complete these steps in order.

---

## 1. Copy the environment file

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in every value as described below.

---

## 2. Clerk — Authentication

1. Go to [https://clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy your keys into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — from Dashboard → API Keys
   - `CLERK_SECRET_KEY` — from Dashboard → API Keys
4. In Clerk Dashboard → **Redirects**, set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/`
   - After sign-up: `/onboarding`

---

## 3. Stream — Video Calls

1. Go to [https://getstream.io](https://getstream.io) and create a free account
2. Create a new app (choose **Video & Audio**)
3. Copy your keys into `.env.local`:
   - `NEXT_PUBLIC_STREAM_API_KEY` — from Dashboard → App → API Keys
   - `STREAM_SECRET_KEY` — from Dashboard → App → API Keys

---

## 4. Supabase — Database

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Copy your keys into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — from Settings → API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Settings → API
   - `SUPABASE_SERVICE_ROLE_KEY` — from Settings → API (keep this secret)

4. Go to **SQL Editor** in Supabase and run each block below one at a time:

### platform_users table
Stores every user who completes onboarding (role + university).

```sql
create table platform_users (
  id text primary key,
  email text,
  full_name text,
  role text check (role in ('student', 'lecturer')),
  university text,
  department text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### lectures table
Stores every meeting/lecture created on the platform.

```sql
create table lectures (
  id uuid primary key default gen_random_uuid(),
  stream_call_id text unique not null,
  title text not null default 'Untitled Lecture',
  description text,
  lecturer_id text not null,
  university text,
  department text,  -- null means visible to all departments in the university
  course_id uuid,
  is_summarized boolean default false,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### transcripts table
Stores speech-to-text chunks captured during lectures.

```sql
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures(id) on delete cascade,
  speaker_id text,
  text text not null,
  timestamp_ms bigint,
  created_at timestamptz default now()
);
```

### lecture_summaries table
Stores AI-generated summaries after a lecture ends.

```sql
create table lecture_summaries (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid unique references lectures(id) on delete cascade,
  summary text not null,
  generated_by text,
  word_count int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### attendance table
Tracks who joined which lecture.

```sql
create table attendance (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures(id) on delete cascade,
  user_id text not null,
  joined_at timestamptz default now(),
  left_at timestamptz,
  unique(lecture_id, user_id)
);
```

### feedback table
Stores feedback submitted by students and lecturers.

```sql
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  lecture_id uuid references lectures(id) on delete set null,
  category text,
  subject text,
  body text,
  rating int check (rating between 1 and 5),
  created_at timestamptz default now()
);
```

### polls table

```sql
create table polls (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]',
  created_by text not null,
  created_at timestamptz default now()
);
```

### poll_votes table

```sql
create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls(id) on delete cascade,
  user_id text not null,
  option_index int not null,
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);
```

### quizzes table

```sql
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]',
  created_by text not null,
  created_at timestamptz default now()
);
```

### quiz_responses table

```sql
create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references quizzes(id) on delete cascade,
  user_id text not null,
  answers jsonb not null default '[]',
  score int,
  created_at timestamptz default now(),
  unique(quiz_id, user_id)
);
```

### whiteboard table

```sql
create table whiteboard (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid unique references lectures(id) on delete cascade,
  state jsonb,
  updated_at timestamptz default now()
);
```

### training_queue table
Used by the AI training pipeline.

```sql
create table training_queue (
  id uuid primary key default gen_random_uuid(),
  raw_text text,
  detected_intent text,
  corrected_intent text,
  created_at timestamptz default now()
);
```

### courses table

```sql
create table courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  description text,
  university text,
  department text,
  created_by text not null,
  created_at timestamptz default now()
);
```

### notifications table
Stores in-app notifications sent to students when a lecturer goes live.

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  body text not null,
  type text not null default 'lecture_live',
  lecture_id uuid references lectures(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

create index on notifications(user_id, read);
```

### course_enrollments table
Tracks which students have explicitly enrolled in each course.

```sql
create table course_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  course_id uuid references courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique(student_id, course_id)
);
```

---

## 5. Inngest — Background Jobs

1. Go to [https://app.inngest.com](https://app.inngest.com) and create a free account
2. Create a new app
3. Copy into `.env.local`:
   - `INNGEST_EVENT_KEY`
   - `INNGEST_SIGNING_KEY`
4. After deploying the app, register your Inngest endpoint:
   - Go to Inngest Dashboard → Apps → Sync new app
   - Enter your deployed URL + `/api/inngest` (e.g. `https://your-app.vercel.app/api/inngest`)

---

## 6. Wit.ai — Voice Commands

1. Go to [https://wit.ai](https://wit.ai) and sign in with Facebook
2. Create a new app
3. Go to Settings → Server Access Token
4. Copy into `.env.local`:
   - `WIT_AI_TOKEN`

---

## 7. OpenRouter — AI (Q&A and Summaries)

1. Go to [https://openrouter.ai](https://openrouter.ai) and create a free account
2. Go to Keys → Create new key
3. Copy into `.env.local`:
   - `OPENROUTER_API_KEY`

> The free tier gives you access to several models including Mistral 7B which the app uses by default.

---

## 8. Upstash Redis — Rate Limiting (Optional)

This prevents users from spamming the AI features. If you skip this, rate limiting is disabled in development.

1. Go to [https://upstash.com](https://upstash.com) and create a free account
2. Create a new Redis database
3. Go to REST API and copy into `.env.local`:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 9. Admin Panel Password

Set a strong password for the `/admin` section:

```
ADMIN_SECRET_PASSWORD=YourStrongPasswordHere
```

Keep this only in `.env.local` — never share it or commit it.

---

## 10. Run the app locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Important Notes

- Never commit `.env.local` to GitHub — it is already in `.gitignore`
- The `.env.example` file is safe to commit — it contains no real secrets, only placeholder values
- Run the Supabase SQL tables in order (some tables reference others)
- The `platform_users` table is populated automatically when users complete onboarding
- The `lectures` table gets a new row every time a lecturer starts or schedules a meeting
