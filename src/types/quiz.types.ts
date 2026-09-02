export type QuizStatus = 'DRAFT' | 'READY' | 'WAITING' | 'LIVE' | 'ENDED';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  marks: number;
  negativeMarks: number;
  timeLimit?: number; // per-question seconds (default 20)
}

export type ParticipantStatus = 'WAITING' | 'LIVE' | 'SUBMITTED' | 'DISCONNECTED';

export interface Participant {
  participantId: string;
  sessionId?: string;
  quizId?: string;
  name: string;
  status: ParticipantStatus;
  joinedAt: number | string;
  submittedAt?: number | string | null;
  score?: number;
  totalMarks?: number;
  timeTakenSeconds?: number;
  correctCount?: number;
  totalQuestions?: number;
  answers?: Record<string, 'A' | 'B' | 'C' | 'D' | null | string>;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

export interface QuizSession {
  sessionId?: string;
  quizId: string;
  pin?: string;
  title?: string;
  category?: string;
  description?: string;
  status: QuizStatus;
  startedAt?: number | null;
  endedAt?: number | null;
  durationSeconds?: number;
  defaultQuestionTime?: number;
  questions?: Question[];
  joinedQuizId?: string | null;
  connectedStudents?: number;
  participants?: Participant[];
  leaderboard?: LeaderboardEntry[];
  lanIp?: string;
  joinBaseUrl?: string;
}

export interface Quiz {
  id: string;
  pin: string;
  title: string;
  category?: string;
  description?: string;
  durationSeconds: number;
  defaultQuestionTime?: number; // default per-question seconds (default 20)
  status: QuizStatus;
  startedAt?: number | null;
  endedAt?: number | null;
  questions: Question[];
}

export interface QuizResult {
  quizId: string;
  quizTitle?: string;
  pin?: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  timeTakenSeconds: number;
  answers?: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  submittedAt?: string;
}

export interface QuizQRPayload {
  type: 'QUIZ_JOIN';
  quizId: string;
  pin: string;
}
