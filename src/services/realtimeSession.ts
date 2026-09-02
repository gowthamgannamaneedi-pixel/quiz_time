import { getDetectedLanHost, setDynamicServerLanIp, getDynamicServerLanIp } from '../utils/deepLink';
import { QuizSession, QuizStatus, Participant, LeaderboardEntry, Question } from '../types/quiz.types';
import { quizStore } from '../store/quizStore';

type SessionListener = (session: QuizSession) => void;

class RealtimeSessionService {
  private ws: WebSocket | null = null;
  private listeners: Set<SessionListener> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private pollingTimer: any = null;
  private serverClockOffset: number = 0;

  private currentSession: QuizSession = {
    sessionId: 'session-college-2026',
    quizId: 'quiz-college-2026',
    pin: '123456',
    title: 'College Quiz 2026',
    category: 'NIAT ADVANCE TECH CLUB',
    description: 'Official Code in Air & Hand Gesture Technology Championship 2026.',
    status: 'READY',
    startedAt: null,
    endedAt: null,
    durationSeconds: 120,
    defaultQuestionTime: 20,
    questions: [],
    joinedQuizId: null,
    connectedStudents: 0,
    participants: [],
    leaderboard: [],
    lanIp: undefined,
    joinBaseUrl: undefined,
  };

  constructor() {
    this.fetchLanInfoDirectly();
    this.connect();
    this.startPolling();
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
    this.listeners.forEach((listener) => listener({ ...this.currentSession }));
  }

  private updateSessionState(newSession: Partial<QuizSession>) {
    const nextStatus = (newSession.status as QuizStatus) || this.currentSession.status;
    const nextConnected = newSession.connectedStudents !== undefined ? newSession.connectedStudents : this.currentSession.connectedStudents;
    const nextPin = newSession.pin !== undefined ? newSession.pin : this.currentSession.pin;
    const nextTitle = newSession.title !== undefined ? newSession.title : this.currentSession.title;
    const nextParticipants = newSession.participants !== undefined ? newSession.participants : this.currentSession.participants;
    const nextLeaderboard = newSession.leaderboard !== undefined ? newSession.leaderboard : this.currentSession.leaderboard;
    const nextLanIp = newSession.lanIp || this.currentSession.lanIp;
    const nextJoinBaseUrl = newSession.joinBaseUrl || this.currentSession.joinBaseUrl;
    const nextQuestions = newSession.questions || this.currentSession.questions;

    if (newSession.lanIp) {
      setDynamicServerLanIp(newSession.lanIp);
    }

    if (Array.isArray(newSession.questions) && newSession.questions.length > 0) {
      quizStore.syncQuestionsFromSession(newSession.questions);
    }

    this.currentSession = {
      ...this.currentSession,
      sessionId: newSession.sessionId || this.currentSession.sessionId,
      quizId: newSession.quizId || this.currentSession.quizId,
      pin: nextPin,
      title: nextTitle,
      category: newSession.category || this.currentSession.category || 'NIAT ADVANCE TECH CLUB',
      description: newSession.description || this.currentSession.description,
      status: nextStatus,
      startedAt: newSession.startedAt !== undefined ? newSession.startedAt : this.currentSession.startedAt,
      endedAt: newSession.endedAt !== undefined ? newSession.endedAt : this.currentSession.endedAt,
      durationSeconds: newSession.durationSeconds || this.currentSession.durationSeconds,
      defaultQuestionTime: newSession.defaultQuestionTime || this.currentSession.defaultQuestionTime,
      questions: nextQuestions,
      connectedStudents: nextConnected,
      participants: nextParticipants,
      leaderboard: nextLeaderboard,
      lanIp: nextLanIp,
      joinBaseUrl: nextJoinBaseUrl,
    };

    this.notify();
  }

  public async fetchLanInfoDirectly(): Promise<string | null> {
    const endpointsToTry = [];
    const hostInfo = getDetectedLanHost();
    const httpProtocol = hostInfo.baseUrl.startsWith('https:') ? 'https:' : 'http:';

    endpointsToTry.push(`${httpProtocol}//${hostInfo.ip}:8082/lan-info`);
    if (hostInfo.ip !== '127.0.0.1' && hostInfo.ip !== 'localhost') {
      endpointsToTry.push(`http://127.0.0.1:8082/lan-info`);
      endpointsToTry.push(`http://localhost:8082/lan-info`);
    }

    for (const url of endpointsToTry) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.lanIp) {
            setDynamicServerLanIp(data.lanIp);
            if (data.lanIp !== this.currentSession.lanIp) {
              this.updateSessionState({
                lanIp: data.lanIp,
                joinBaseUrl: data.joinBaseUrl || `http://${data.lanIp}:8081`,
              });
            }
            return data.lanIp;
          }
        }
      } catch {
        // continue to next endpoint
      }
    }
    return null;
  }

  public async fetchSessionDirectly(): Promise<QuizSession> {
    const endpointsToTry = [];
    const hostInfo = getDetectedLanHost();
    const httpProtocol = hostInfo.baseUrl.startsWith('https:') ? 'https:' : 'http:';

    endpointsToTry.push(`${httpProtocol}//${hostInfo.ip}:8082/session`);
    if (hostInfo.ip !== '127.0.0.1' && hostInfo.ip !== 'localhost') {
      endpointsToTry.push(`http://127.0.0.1:8082/session`);
      endpointsToTry.push(`http://localhost:8082/session`);
    }

    for (const url of endpointsToTry) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.session) {
            if (data.serverTime) {
              this.serverClockOffset = data.serverTime - Date.now();
            }
            this.updateSessionState(data.session);
            return this.currentSession;
          }
        }
      } catch {
        // try next endpoint
      }
    }

    return this.currentSession;
  }

  public async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    const endpointsToTry = [];
    const hostInfo = getDetectedLanHost();
    const httpProtocol = hostInfo.baseUrl.startsWith('https:') ? 'https:' : 'http:';

    endpointsToTry.push(`${httpProtocol}//${hostInfo.ip}:8082/leaderboard`);
    if (hostInfo.ip !== '127.0.0.1' && hostInfo.ip !== 'localhost') {
      endpointsToTry.push(`http://127.0.0.1:8082/leaderboard`);
      endpointsToTry.push(`http://localhost:8082/leaderboard`);
    }

    for (const url of endpointsToTry) {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.leaderboard) {
            this.updateSessionState({ leaderboard: data.leaderboard });
            return data.leaderboard;
          }
        }
      } catch {
        // continue
      }
    }
    return this.currentSession.leaderboard || [];
  }

  private startPolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(() => {
      this.fetchSessionDirectly().catch(() => {});
    }, 2000);
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const hostInfo = getDetectedLanHost();
    const wsProtocol = hostInfo.baseUrl.startsWith('https:') ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${hostInfo.ip}:8082`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        console.log('[RealtimeSession] Connected to WebSocket at', wsUrl);

        this.send({
          type: 'PING',
          clientTime: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'PONG' && data.serverTime) {
            this.serverClockOffset = data.serverTime - Date.now();
            return;
          }

          if (data.type === 'SESSION_UPDATE' && data.session) {
            if (data.serverTime) {
              this.serverClockOffset = data.serverTime - Date.now();
            }
            this.updateSessionState(data.session);
          }
        } catch (err) {
          console.error('[RealtimeSession] Error parsing WS message:', err);
        }
      };

      this.ws.onerror = () => {
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;

        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, 3000);
      };
    } catch (err) {
      this.isConnecting = false;
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, 3000);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Admin Actions
  public adminOpenWaitingRoom() {
    this.send({
      type: 'ADMIN_ACTION',
      action: 'OPEN_WAITING_ROOM',
    });
    this.updateSessionState({ status: 'WAITING' });
  }

  public adminStartLiveQuiz() {
    const startedAt = Date.now();
    this.send({
      type: 'ADMIN_ACTION',
      action: 'START_LIVE_QUIZ',
    });
    this.updateSessionState({
      status: 'LIVE',
      startedAt,
      endedAt: null,
    });
  }

  public adminEndQuiz() {
    const endedAt = Date.now();
    this.send({
      type: 'ADMIN_ACTION',
      action: 'END_QUIZ',
    });
    this.updateSessionState({
      status: 'ENDED',
      endedAt,
    });
  }

  public adminResetSession() {
    this.send({
      type: 'ADMIN_ACTION',
      action: 'RESET_SESSION',
    });
    this.updateSessionState({
      status: 'READY',
      startedAt: null,
      endedAt: null,
      participants: [],
      leaderboard: [],
    });
  }

  public adminUpdateSettings(settings: {
    pin?: string;
    title?: string;
    category?: string;
    description?: string;
    defaultQuestionTime?: number;
    questions?: Question[];
  }) {
    // 1. Dual send via WebSocket
    this.send({
      type: 'ADMIN_ACTION',
      action: 'UPDATE_SETTINGS',
      payload: settings,
    });

    // 2. Dual send via HTTP POST for 100% guarantee
    const hostInfo = getDetectedLanHost();
    const httpProtocol = hostInfo.baseUrl.startsWith('https:') ? 'https:' : 'http:';
    fetch(`${httpProtocol}//${hostInfo.ip}:8082/admin/update-settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {});

    this.updateSessionState(settings);
  }

  // Student Actions
  public registerStudent(name: string, participantId: string) {
    this.send({
      type: 'REGISTER_STUDENT',
      name,
      participantId,
    });
  }

  public saveAnswer(participantId: string, questionId: string, selectedAnswer: 'A' | 'B' | 'C' | 'D', studentName?: string) {
    this.send({
      type: 'STUDENT_ANSWER',
      participantId,
      questionId,
      selectedAnswer,
      studentName,
    });
  }

  public submitStudentResult(participantId: string, result: any, studentName?: string) {
    // 1. Send via WebSocket
    this.send({
      type: 'STUDENT_SUBMIT',
      participantId,
      result,
      studentName,
    });

    // 2. Dual send via HTTP POST for 100% reliability
    const hostInfo = getDetectedLanHost();
    const httpProtocol = hostInfo.baseUrl.startsWith('https:') ? 'https:' : 'http:';
    fetch(`${httpProtocol}//${hostInfo.ip}:8082/submit-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId,
        result,
        studentName,
      }),
    }).catch(() => {});
  }
}

export const realtimeSession = new RealtimeSessionService();
