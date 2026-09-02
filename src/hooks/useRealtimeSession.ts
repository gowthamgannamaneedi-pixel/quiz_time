import { useState, useEffect } from 'react';
import { realtimeSession } from '../services/realtimeSession';
import { QuizSession } from '../types/quiz.types';
import { getOrCreateParticipantId } from '../utils/studentSession';

export const useRealtimeSession = () => {
  const [session, setSession] = useState<QuizSession>(realtimeSession.getSession());

  useEffect(() => {
    const unsubscribe = realtimeSession.subscribe((updatedSession) => {
      setSession(updatedSession);
    });
    return unsubscribe;
  }, []);

  return {
    session,
    pin: session.pin || '123456',
    title: session.title || 'College Quiz 2026',
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    connectedStudents: session.connectedStudents || 0,
    participants: session.participants || [],
    leaderboard: session.leaderboard || [],
    isWaiting: session.status === 'WAITING',
    isLive: session.status === 'LIVE',
    isEnded: session.status === 'ENDED',
    isReady: session.status === 'READY',
    fetchLeaderboard: () => realtimeSession.fetchLeaderboard(),
    openWaitingRoom: () => realtimeSession.adminOpenWaitingRoom(),
    startLiveQuiz: () => realtimeSession.adminStartLiveQuiz(),
    endLiveQuiz: () => realtimeSession.adminEndQuiz(),
    resetSession: () => realtimeSession.adminResetSession(),
    updateSettings: (settings: { pin?: string; title?: string; category?: string; description?: string; defaultQuestionTime?: number }) =>
      realtimeSession.adminUpdateSettings(settings),
    registerStudent: (studentName: string, participantId?: string) =>
      realtimeSession.registerStudent(studentName, participantId || getOrCreateParticipantId()),
  };
};
