import { getDetectedLanHost, setDynamicServerLanIp, getDynamicServerLanIp, isProductionEnvironment, PRODUCTION_DOMAIN } from '../utils/deepLink';
import { QuizSession, QuizStatus, Participant, LeaderboardEntry, Question, QuizResult } from '../types/quiz.types';
import { INITIAL_10_QUESTIONS } from '../data/initialQuestions';
import { quizStore } from '../store/quizStore';

type SessionListener = (session: QuizSession) => void;

const SUPABASE_WS_URL = 'wss://domnwcmnvmrzoojbswmz.supabase.co/realtime/v1/websocket?apikey=sb_publishable_eqfFFuZZefKyNwMYFj7hwQ_g6ytJHx6&vsn=1.0.0';
const SUPABASE_CHANNEL_TOPIC = 'realtime:quiz_college_2026';
const SESSION_STORAGE_KEY = '@syncquiz_active_session_v9';

function parseAuthoritativeTimestamp(val: any): number {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string' && val.trim()) {
    const parsed = new Date(val).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export function buildAuthoritativeLeaderboard(participants: Participant[]): LeaderboardEntry[] {
  return (participants || [])
    .filter((item) => item.status === 'SUBMITTED')
    .map((item) => {
      const pScore = typeof item.score === 'number' && !isNaN(item.score) ? item.score : 0;
      const pMax = typeof item.totalMarks === 'number' && item.totalMarks > 0 ? item.totalMarks : 20;
      const pTime = typeof item.timeTakenSeconds === 'number' && !isNaN(item.timeTakenSeconds) && item.timeTakenSeconds > 0 ? Math.round(item.timeTakenSeconds) : 200;
      const pCorrect = typeof item.correctCount === 'number' ? item.correctCount : 0;
      const pTotalQ = typeof item.totalQuestions === 'number' && item.totalQuestions > 0 ? item.totalQuestions : 10;
      const pSubmittedAt = item.submittedAt ? String(item.submittedAt) : new Date().toISOString();

      return {
        rank: 1,
        participantId: item.participantId,
        studentName: item.name || 'Student',
        score: pScore,
        maxScore: pMax,
        percentage: pMax > 0 ? Math.round((pScore / pMax) * 100) : 0,
        correctCount: pCorrect,
        totalQuestions: pTotalQ,
        timeTakenSeconds: pTime,
        submittedAt: pSubmittedAt,
      };
    })
    .sort((a, b) => {
      // 1. Primary: Higher score first
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // 2. Secondary: Faster completion time first
      if (a.timeTakenSeconds !== b.timeTakenSeconds) {
        return a.timeTakenSeconds - b.timeTakenSeconds;
      }

      // 3. Final tie-breaker: Earlier authoritative submission timestamp first
      const timeA = parseAuthoritativeTimestamp(a.submittedAt);
      const timeB = parseAuthoritativeTimestamp(b.submittedAt);
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // 4. Deterministic unique ordering fallback
      return String(a.participantId || '').localeCompare(String(b.participantId || ''));
    })
    .map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
}

class RealtimeSessionService {
  private ws: any = null;
  private listeners: Set<SessionListener> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private serverClockOffset: number = 0;
  private messageRefCounter: number = 1;
  private channelJoined: boolean = false;
  private currentParticipantId: string = 'admin';
  private currentStudentName: string = 'Admin';

  private currentSession: QuizSession = {
    sessionId: 'session-college-2026',
    quizId: 'quiz-college-2026',
    pin: '123456',
    title: 'College Quiz 2026',
    category: 'NIAT ADVANCED TECH CLUB',
    description: 'Official Code in Air & Hand Gesture Technology Championship 2026.',
    status: 'READY',
    startedAt: null,
    endedAt: null,
    durationSeconds: 200,
    defaultQuestionTime: 20,
    questions: INITIAL_10_QUESTIONS,
    joinedQuizId: null,
    connectedStudents: 0,
    participants: [],
    leaderboard: [],
    lanIp: undefined,
    joinBaseUrl: PRODUCTION_DOMAIN,
  };

  constructor() {
    try {
      this.loadPersistedSession();
    } catch {
      // ignore
    }
  }

  private loadPersistedSession() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.sessionId) {
            this.currentSession = {
              ...this.currentSession,
              ...parsed,
              questions: (parsed.questions && parsed.questions.length === 10) ? parsed.questions : INITIAL_10_QUESTIONS,
            };
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private persistSession() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
          sessionId: this.currentSession.sessionId,
          quizId: this.currentSession.quizId,
          pin: this.currentSession.pin,
          title: this.currentSession.title,
          category: this.currentSession.category,
          description: this.currentSession.description,
          status: this.currentSession.status,
          startedAt: this.currentSession.startedAt,
          endedAt: this.currentSession.endedAt,
          durationSeconds: this.currentSession.durationSeconds,
          defaultQuestionTime: this.currentSession.defaultQuestionTime,
          questions: this.currentSession.questions,
          leaderboard: this.currentSession.leaderboard,
          participants: this.currentSession.participants,
        }));
      } catch {
        // ignore
      }
    }
  }

  public getAuthoritativeServerTime(): number {
    return Date.now() + this.serverClockOffset;
  }

  public getServerClockOffset(): number {
    return this.serverClockOffset;
  }

  public getSession(): QuizSession {
    return { ...this.currentSession };
  }

  public getServerLanIp(): string | null {
    return this.currentSession.lanIp || getDynamicServerLanIp();
  }

  public subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.currentSession });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.persistSession();
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.currentSession });
      } catch {
        // ignore
      }
    });
  }

  private updateSessionState(newSession: Partial<QuizSession>) {
    const nextStatus = (newSession.status as QuizStatus) || this.currentSession.status;
    const nextPin = newSession.pin !== undefined ? newSession.pin : this.currentSession.pin;
    const nextTitle = newSession.title !== undefined ? newSession.title : this.currentSession.title;
    const nextParticipants = newSession.participants !== undefined ? newSession.participants : this.currentSession.participants;
    const nextLeaderboard = nextParticipants && nextParticipants.length > 0
      ? buildAuthoritativeLeaderboard(nextParticipants)
      : (newSession.leaderboard !== undefined ? newSession.leaderboard : this.currentSession.leaderboard);
    const nextQuestions = (newSession.questions && newSession.questions.length > 0) ? newSession.questions : this.currentSession.questions;
    const nextConnected = newSession.connectedStudents !== undefined
      ? newSession.connectedStudents
      : (nextParticipants ? nextParticipants.length : this.currentSession.connectedStudents);

    if (newSession.lanIp) {
      setDynamicServerLanIp(newSession.lanIp);
    }

    if (Array.isArray(newSession.questions) && newSession.questions.length > 0) {
      try {
        quizStore.syncQuestionsFromSession(newSession.questions);
      } catch {
        // ignore
      }
    }

    this.currentSession = {
      ...this.currentSession,
      sessionId: newSession.sessionId || this.currentSession.sessionId,
      quizId: newSession.quizId || this.currentSession.quizId,
      pin: nextPin,
      title: nextTitle,
      category: newSession.category || this.currentSession.category || 'NIAT ADVANCED TECH CLUB',
      description: newSession.description || this.currentSession.description,
      status: nextStatus,
      startedAt: newSession.startedAt !== undefined ? newSession.startedAt : this.currentSession.startedAt,
      endedAt: newSession.endedAt !== undefined ? newSession.endedAt : this.currentSession.endedAt,
      durationSeconds: newSession.durationSeconds || this.currentSession.durationSeconds || 200,
      defaultQuestionTime: newSession.defaultQuestionTime || this.currentSession.defaultQuestionTime || 20,
      questions: nextQuestions,
      connectedStudents: nextConnected,
      participants: nextParticipants,
      leaderboard: nextLeaderboard,
      lanIp: newSession.lanIp || this.currentSession.lanIp,
      joinBaseUrl: newSession.joinBaseUrl || this.currentSession.joinBaseUrl || PRODUCTION_DOMAIN,
    };

    this.notify();
  }

  public connect() {
    if (typeof WebSocket === 'undefined') return;
    if (this.ws && (this.ws.readyState === 1 || this.ws.readyState === 0)) {
      return;
    }

    this.isConnecting = true;
    const wsUrl = SUPABASE_WS_URL;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[RealtimeSession] Connected to Supabase Cloud Realtime WebSocket');

        // Join the topic channel
        this.joinChannel();

        // Start Heartbeat PING every 25 seconds
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
          this.sendHeartbeat();
        }, 25000);

        // Request initial synchronization
        this.broadcastEvent('REQUEST_SYNC', { clientTime: Date.now() });
      };

      this.ws.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);

          // 1. Channel join reply
          if (data.event === 'phx_reply' && data.payload?.status === 'ok') {
            this.channelJoined = true;
            return;
          }

          // 2. Broadcast events from Admin or other students
          if (data.event === 'broadcast' && data.payload) {
            const innerEvent = data.payload.event;
            const innerPayload = data.payload.payload;

            if (innerEvent === 'SESSION_UPDATE' && innerPayload?.session) {
              if (innerPayload.serverTime) {
                this.serverClockOffset = innerPayload.serverTime - Date.now();
              }
              this.updateSessionState(innerPayload.session);
            } else if (innerEvent === 'REQUEST_SYNC') {
              if (this.currentSession.status !== 'DRAFT') {
                this.broadcastEvent('SESSION_UPDATE', {
                  session: this.currentSession,
                  serverTime: Date.now(),
                });
              }
            } else if (innerEvent === 'REGISTER_STUDENT' && innerPayload) {
              this.handleStudentRegistered(innerPayload.name, innerPayload.participantId);
            } else if (innerEvent === 'STUDENT_ANSWER' && innerPayload) {
              this.handleStudentAnswered(innerPayload.participantId, innerPayload.questionId, innerPayload.selectedAnswer);
            } else if (innerEvent === 'STUDENT_SUBMIT' && innerPayload) {
              this.handleStudentSubmitted(innerPayload.participantId, innerPayload.result, innerPayload.studentName);
            }
          }
        } catch (err) {
          console.error('[RealtimeSession] Error processing message:', err);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.channelJoined = false;
        this.ws = null;
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 2000);
      };
    } catch {
      this.isConnecting = false;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 2000);
    }
  }

  private joinChannel() {
    if (!this.ws || this.ws.readyState !== 1) return;

    const joinMessage = {
      topic: SUPABASE_CHANNEL_TOPIC,
      event: 'phx_join',
      payload: {
        config: {
          broadcast: { self: true, ack: false },
          presence: { key: this.currentParticipantId },
        },
      },
      ref: String(this.messageRefCounter++),
    };

    try {
      this.ws.send(JSON.stringify(joinMessage));
    } catch {
      // ignore
    }
  }

  private sendHeartbeat() {
    if (!this.ws || this.ws.readyState !== 1) return;

    try {
      this.ws.send(JSON.stringify({
        topic: 'phoenix',
        event: 'heartbeat',
        payload: {},
        ref: `hb_${this.messageRefCounter++}`,
      }));
    } catch {
      // ignore
    }
  }

  private broadcastEvent(eventName: string, payload: any) {
    if (this.ws && this.ws.readyState === 1) {
      const broadcastMsg = {
        topic: SUPABASE_CHANNEL_TOPIC,
        event: 'broadcast',
        payload: {
          type: 'broadcast',
          event: eventName,
          payload,
        },
        ref: String(this.messageRefCounter++),
      };
      try {
        this.ws.send(JSON.stringify(broadcastMsg));
      } catch {
        // ignore
      }
    }
  }

  private handleStudentRegistered(name: string, participantId: string) {
    const existing = [...(this.currentSession.participants || [])];
    const index = existing.findIndex((p) => p.participantId === participantId);

    if (index >= 0) {
      existing[index] = {
        ...existing[index],
        name,
        status: existing[index].status || 'WAITING',
      };
    } else {
      existing.push({
        participantId,
        name,
        joinedAt: new Date().toISOString(),
        status: 'WAITING',
        answers: {},
      });
    }

    this.updateSessionState({
      participants: existing,
      connectedStudents: existing.length,
    });
  }

  private handleStudentAnswered(participantId: string, questionId: string, selectedAnswer: 'A' | 'B' | 'C' | 'D') {
    const participants = [...(this.currentSession.participants || [])];
    const p = participants.find((item) => item.participantId === participantId);
    if (p) {
      p.status = 'LIVE';
      p.answers = p.answers || {};
      p.answers[questionId] = selectedAnswer;
      this.updateSessionState({ participants });
    }
  }

  private handleStudentSubmitted(participantId: string, result: QuizResult, studentName?: string) {
    const participants = [...(this.currentSession.participants || [])];
    const p = participants.find((item) => item.participantId === participantId);
    const name = studentName || (p ? p.name : 'Student');

    if (p) {
      p.status = 'SUBMITTED';
      p.score = result.score;
      p.totalMarks = result.maxScore;
      p.timeTakenSeconds = result.timeTakenSeconds;
      p.correctCount = result.correctCount;
      p.totalQuestions = result.totalQuestions;
      p.submittedAt = result.submittedAt || new Date().toISOString();
    } else {
      participants.push({
        participantId,
        name,
        joinedAt: new Date().toISOString(),
        status: 'SUBMITTED',
        score: result.score,
        totalMarks: result.maxScore,
        timeTakenSeconds: result.timeTakenSeconds,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        submittedAt: result.submittedAt || new Date().toISOString(),
        answers: result.answers || {},
      });
    }

    // Update & sort Leaderboard with Authoritative Deterministic Tie-Breaking
    const leaderboard = buildAuthoritativeLeaderboard(participants);

    this.updateSessionState({
      participants,
      leaderboard,
    });
  }

  // --- ADMIN ACTIONS ---
  public adminOpenWaitingRoom() {
    const updated = {
      ...this.currentSession,
      status: 'WAITING' as QuizStatus,
    };
    this.updateSessionState(updated);
    this.broadcastEvent('SESSION_UPDATE', { session: updated, serverTime: Date.now() });
  }

  public adminStartLiveQuiz() {
    const startedAt = Date.now();
    const updated = {
      ...this.currentSession,
      status: 'LIVE' as QuizStatus,
      startedAt,
      endedAt: null,
    };
    this.updateSessionState(updated);
    this.broadcastEvent('SESSION_UPDATE', { session: updated, serverTime: startedAt });
  }

  public adminEndQuiz() {
    const endedAt = Date.now();
    const updated = {
      ...this.currentSession,
      status: 'ENDED' as QuizStatus,
      endedAt,
    };
    this.updateSessionState(updated);
    this.broadcastEvent('SESSION_UPDATE', { session: updated, serverTime: endedAt });
  }

  public adminResetSession() {
    const updated = {
      ...this.currentSession,
      status: 'READY' as QuizStatus,
      startedAt: null,
      endedAt: null,
      participants: [],
      leaderboard: [],
      connectedStudents: 0,
    };
    this.updateSessionState(updated);
    this.broadcastEvent('SESSION_UPDATE', { session: updated, serverTime: Date.now() });
  }

  public adminUpdateSettings(settings: {
    pin?: string;
    title?: string;
    category?: string;
    description?: string;
    defaultQuestionTime?: number;
    questions?: Question[];
  }) {
    const updated = {
      ...this.currentSession,
      ...settings,
    };
    this.updateSessionState(updated);
    this.broadcastEvent('SESSION_UPDATE', { session: updated, serverTime: Date.now() });
  }

  // --- STUDENT ACTIONS ---
  public registerStudent(name: string, participantId: string) {
    this.currentParticipantId = participantId;
    this.currentStudentName = name;
    this.handleStudentRegistered(name, participantId);
    this.broadcastEvent('REGISTER_STUDENT', { name, participantId });
  }

  public saveAnswer(participantId: string, questionId: string, selectedAnswer: 'A' | 'B' | 'C' | 'D', studentName?: string) {
    this.handleStudentAnswered(participantId, questionId, selectedAnswer);
    this.broadcastEvent('STUDENT_ANSWER', { participantId, questionId, selectedAnswer, studentName });
  }

  public submitStudentResult(participantId: string, result: QuizResult, studentName?: string) {
    this.handleStudentSubmitted(participantId, result, studentName);
    this.broadcastEvent('STUDENT_SUBMIT', { participantId, result, studentName });
  }

  public async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    return buildAuthoritativeLeaderboard(this.currentSession.participants || []);
  }

  public async fetchSessionDirectly(): Promise<QuizSession> {
    return this.getSession();
  }

  public async fetchLanInfoDirectly(): Promise<string | null> {
    return null;
  }
}

export const realtimeSession = new RealtimeSessionService();
