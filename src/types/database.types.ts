export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'student';
export type QuizStatus = 'DRAFT' | 'WAITING' | 'RUNNING' | 'ENDED';
export type ParticipantStatus = 'WAITING' | 'WRITING' | 'SUBMITTED' | 'DISCONNECTED' | 'AUTO_SUBMITTED';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Hall {
  id: string;
  name: string;
  code: string;
  max_capacity: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  join_code: string;
  duration_minutes: number;
  default_marks_per_question: number;
  default_negative_marks: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  anti_cheat_fullscreen: boolean;
  anti_cheat_tab_switch_limit: number;
  show_results_immediately: boolean;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negative_marks: number;
  created_at: string;
  updated_at: string;
}

export interface SanitizedQuestion {
  id: string;
  order_index: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  negative_marks: number;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  status: QuizStatus;
  started_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizParticipant {
  id: string;
  session_id: string;
  student_id_number: string;
  student_name: string;
  hall_id: string;
  auth_user_id: string | null;
  status: ParticipantStatus;
  last_heartbeat: string;
  joined_at: string;
}

export interface QuizAttempt {
  id: string;
  participant_id: string;
  session_id: string;
  question_order: string[];
  option_order: Record<string, string[]>;
  started_at: string;
  submitted_at: string | null;
  is_auto_submitted: boolean;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED';
  tab_switch_count: number;
  fullscreen_exit_count: number;
}

export interface Answer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option: 'A' | 'B' | 'C' | 'D' | null;
  is_marked_for_review: boolean;
  saved_at: string;
}

export interface Result {
  id: string;
  attempt_id: string;
  session_id: string;
  participant_id: string;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  unanswered_count: number;
  score: number;
  percentage: number;
  time_taken_seconds: number;
  rank: number | null;
  calculated_at: string;
}

export interface SuspiciousEvent {
  id: string;
  attempt_id: string;
  event_type: string;
  details: Json;
  recorded_at: string;
}
