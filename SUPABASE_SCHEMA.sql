-- ============================================================
-- YOOM AI — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Courses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  lecturer_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lectures ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  stream_call_id TEXT NOT NULL,
  lecturer_id TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  recording_url TEXT,
  is_summarized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Transcripts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  speaker_id TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transcripts_lecture ON transcripts(lecture_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON transcripts(timestamp_ms);

-- ─── Polls ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  votes JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- ─── Poll Votes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- ─── Quizzes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  time_limit_seconds INTEGER DEFAULT 30,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Quiz Responses ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quiz_id, user_id)
);

-- ─── Attendance ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lecture_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_attendance_lecture ON attendance(lecture_id);

-- ─── Whiteboard Events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whiteboard_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('draw', 'erase', 'clear', 'permission_grant', 'permission_revoke')),
  payload JSONB NOT NULL DEFAULT '{}',
  timestamp_ms BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whiteboard_lecture ON whiteboard_events(lecture_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_timestamp ON whiteboard_events(timestamp_ms);

-- ─── Lecture Summaries ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lecture_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE UNIQUE,
  summary TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Assignments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Intent Log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  intent TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Training Queue ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  raw_intent TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  corrected_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lecture Events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lecture_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────
-- NOTE: RLS uses Clerk user IDs. Enable RLS after setup.
-- For now, API routes use the service role key (bypasses RLS).
-- Enable RLS per table as your security model matures.

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_events ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by server-side API routes)
-- All API routes use supabaseAdmin which uses the service role key
-- This is correct and intentional.

-- ─── Add unique constraint on stream_call_id (required for upsert) ────────────
-- Run this if lectures table was already created without the constraint
ALTER TABLE lectures ADD CONSTRAINT lectures_stream_call_id_unique UNIQUE (stream_call_id);

-- ─── Feedback ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'experience', 'lecture')),
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  subject TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'lecture_live',
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── Course Enrollments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
