// ============================================================
// GLOBAL TYPES FOR YOOM-AI PLATFORM
// ============================================================

export type UserRole = 'lecturer' | 'participant';

export interface UserPublicMetadata {
  role: UserRole;
}

// ─── Lecture ────────────────────────────────────────────────
export interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  stream_call_id: string;
  lecturer_id: string;
  started_at?: string;
  ended_at?: string;
  recording_url?: string;
  created_at: string;
}

// ─── Course ─────────────────────────────────────────────────
export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  lecturer_id: string;
  created_at: string;
}

// ─── Transcript ─────────────────────────────────────────────
export interface TranscriptChunk {
  id: string;
  lecture_id: string;
  speaker_id: string;
  text: string;
  timestamp_ms: number;
  created_at: string;
}

// ─── Poll ───────────────────────────────────────────────────
export interface Poll {
  id: string;
  lecture_id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  created_by: string;
  created_at: string;
  closed_at?: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
}

// ─── Quiz ───────────────────────────────────────────────────
export interface Quiz {
  id: string;
  lecture_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  time_limit_seconds: number;
  created_by: string;
  created_at: string;
}

export interface QuizResponse {
  id: string;
  quiz_id: string;
  user_id: string;
  answer_index: number;
  is_correct: boolean;
  responded_at: string;
}

// ─── Attendance ─────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  lecture_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds?: number;
}

// ─── Whiteboard ─────────────────────────────────────────────
export interface WhiteboardEvent {
  id: string;
  lecture_id: string;
  user_id: string;
  event_type: 'draw' | 'erase' | 'clear' | 'permission_grant' | 'permission_revoke';
  payload: Record<string, unknown>;
  timestamp_ms: number;
  created_at: string;
}

// ─── Analytics ──────────────────────────────────────────────
export interface EngagementAnalytics {
  lecture_id: string;
  total_participants: number;
  avg_duration_seconds: number;
  poll_participation_rate: number;
  quiz_avg_score: number;
  focus_mode_usage_rate: number;
  peak_concurrent: number;
}

// ─── AI Intent ──────────────────────────────────────────────
export type IntentName =
  | 'start_recording'
  | 'stop_recording'
  | 'show_poll'
  | 'create_quiz'
  | 'assign_homework'
  | 'summarize_lecture'
  | 'mute_all'
  | 'unknown';

export interface WitIntent {
  intent: IntentName;
  confidence: number;
  text: string;
  lecture_id: string;
  user_id: string;
}

// ─── Training Queue ─────────────────────────────────────────
export interface TrainingQueueItem {
  id: string;
  text: string;
  raw_intent: string;
  confidence: number;
  corrected_intent?: string;
  created_at: string;
}

// ─── Stream Custom Events ───────────────────────────────────
export interface StreamPollEvent {
  type: 'poll.created' | 'poll.updated' | 'poll.closed';
  poll: Poll;
}

export interface StreamQuizEvent {
  type: 'quiz.created' | 'quiz.closed';
  quiz: Quiz;
}

export interface StreamWhiteboardEvent {
  type: 'whiteboard.update';
  events: WhiteboardEvent[];
}

export interface StreamDataSaverEvent {
  type: 'datasaver.changed';
  userId: string;
  enabled: boolean;
}
