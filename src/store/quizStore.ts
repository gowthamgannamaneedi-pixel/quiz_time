import AsyncStorage from '@react-native-async-storage/async-storage';
import { Quiz, Question, QuizStatus, QuizSession, QuizQRPayload } from '../types/quiz.types';
import { realtimeSession } from '../services/realtimeSession';
import { INITIAL_10_QUESTIONS } from '../data/initialQuestions';

const STORAGE_KEY = '@syncquiz_active_quiz_v7';

export const INITIAL_QUIZ: Quiz = {
  id: 'quiz-college-2026',
  pin: '123456',
  title: 'College Quiz 2026',
  category: 'NIAT ADVANCE TECH CLUB',
  description: 'Official Code in Air & Hand Gesture Technology Championship 2026.',
  durationSeconds: 200, // 10 questions × 20s = 200s
  defaultQuestionTime: 20, // default 20s per question
  status: 'READY',
  startedAt: null,
  endedAt: null,
  questions: INITIAL_10_QUESTIONS,
};

const getSynchronousInitialQuiz = (): Quiz => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Purge old legacy caches
      window.localStorage.removeItem('@syncquiz_active_quiz_v4');
      window.localStorage.removeItem('@syncquiz_active_quiz_v5');
      window.localStorage.removeItem('@syncquiz_active_quiz_v6');

      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && Array.isArray(parsed.questions) && parsed.questions.length === 10) {
          return {
            ...parsed,
            category: 'NIAT ADVANCE TECH CLUB',
            durationSeconds: parsed.questions.length * (parsed.defaultQuestionTime || 20),
            status: 'READY',
            startedAt: null,
            endedAt: null,
          };
        }
      }
    } catch {
      // Fallback
    }
  }
  return { ...INITIAL_QUIZ };
};

let currentQuiz: Quiz = getSynchronousInitialQuiz();
let joinedQuizId: string | null = null;
const listeners = new Set<(quiz: Quiz) => void>();

const notify = () => {
  listeners.forEach((listener) => {
    try {
      listener({ ...currentQuiz });
    } catch {
      // ignore
    }
  });
  saveToStorage();
};

const saveToStorage = async () => {
  try {
    const serialized = JSON.stringify(currentQuiz);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    }
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.warn('Failed to persist quiz to storage:', err);
  }
};

const broadcastAdminUpdate = () => {
  try {
    realtimeSession.adminUpdateSettings({
      pin: currentQuiz.pin,
      title: currentQuiz.title,
      category: currentQuiz.category,
      description: currentQuiz.description,
      defaultQuestionTime: currentQuiz.defaultQuestionTime,
      questions: currentQuiz.questions,
    });
  } catch {
    // ignore
  }
};

export const quizStore = {
  getQuiz: (): Quiz => ({ ...currentQuiz }),

  subscribe: (listener: (quiz: Quiz) => void): (() => void) => {
    listeners.add(listener);
    listener({ ...currentQuiz });
    return () => {
      listeners.delete(listener);
    };
  },

  syncQuestionsFromSession: (serverQuestions: Question[]) => {
    if (!Array.isArray(serverQuestions) || serverQuestions.length === 0) return;
    const isDifferent = JSON.stringify(serverQuestions) !== JSON.stringify(currentQuiz.questions);
    if (isDifferent) {
      currentQuiz = {
        ...currentQuiz,
        questions: [...serverQuestions],
        durationSeconds: serverQuestions.length * (currentQuiz.defaultQuestionTime || 20),
      };
      notify();
    }
  },

  updateQuizSettings: (updates: {
    title?: string;
    category?: string;
    description?: string;
    pin?: string;
  }) => {
    currentQuiz = {
      ...currentQuiz,
      title: updates.title !== undefined ? updates.title : currentQuiz.title,
      category: updates.category !== undefined ? updates.category : currentQuiz.category,
      description: updates.description !== undefined ? updates.description : currentQuiz.description,
      pin: updates.pin !== undefined ? updates.pin : currentQuiz.pin,
    };
    notify();
    broadcastAdminUpdate();
  },

  updateDuration: (durationSeconds: number) => {
    currentQuiz = {
      ...currentQuiz,
      durationSeconds,
    };
    notify();
    broadcastAdminUpdate();
  },

  updateDefaultQuestionTime: (seconds: number) => {
    const validSecs = Math.max(5, Math.min(300, seconds));
    const updatedQuestions = currentQuiz.questions.map((q) => ({
      ...q,
      timeLimit: validSecs,
    }));
    currentQuiz = {
      ...currentQuiz,
      defaultQuestionTime: validSecs,
      questions: updatedQuestions,
      durationSeconds: updatedQuestions.length * validSecs,
    };
    notify();
    broadcastAdminUpdate();
  },

  updateStatus: (status: QuizStatus) => {
    currentQuiz = {
      ...currentQuiz,
      status,
    };
    notify();
  },

  openWaitingRoom: () => {
    currentQuiz = {
      ...currentQuiz,
      status: 'WAITING',
    };
    notify();
    try {
      realtimeSession.adminOpenWaitingRoom();
    } catch {
      // ignore
    }
  },

  startLiveQuiz: () => {
    const startedAt = Date.now();
    currentQuiz = {
      ...currentQuiz,
      status: 'LIVE',
      startedAt,
      endedAt: null,
    };
    notify();
    try {
      realtimeSession.adminStartLiveQuiz();
    } catch {
      // ignore
    }
  },

  endLiveQuiz: () => {
    const endedAt = Date.now();
    currentQuiz = {
      ...currentQuiz,
      status: 'ENDED',
      endedAt,
    };
    notify();
    try {
      realtimeSession.adminEndQuiz();
    } catch {
      // ignore
    }
  },

  resetQuizSession: () => {
    currentQuiz = {
      ...INITIAL_QUIZ,
      status: 'READY',
      startedAt: null,
      endedAt: null,
    };
    joinedQuizId = null;
    notify();
    try {
      realtimeSession.adminResetSession();
    } catch {
      // ignore
    }
  },

  addQuestion: (question: Omit<Question, 'id'>) => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newQuestion: Question = {
      ...question,
      id: newId,
      marks: question.marks || 2,
      negativeMarks: 0,
      timeLimit: question.timeLimit || currentQuiz.defaultQuestionTime || 20,
    };
    const updatedQuestions = [...currentQuiz.questions, newQuestion];
    currentQuiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      durationSeconds: updatedQuestions.length * (currentQuiz.defaultQuestionTime || 20),
    };
    notify();
    broadcastAdminUpdate();
  },

  updateQuestion: (id: string, updates: Partial<Question>) => {
    const updatedQuestions = currentQuiz.questions.map((q) =>
      q.id === id ? { ...q, ...updates, negativeMarks: 0 } : q
    );
    currentQuiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      durationSeconds: updatedQuestions.length * (currentQuiz.defaultQuestionTime || 20),
    };
    notify();
    broadcastAdminUpdate();
  },

  deleteQuestion: (id: string) => {
    const updatedQuestions = currentQuiz.questions.filter((q) => q.id !== id);
    currentQuiz = {
      ...currentQuiz,
      questions: updatedQuestions,
      durationSeconds: updatedQuestions.length * (currentQuiz.defaultQuestionTime || 20),
    };
    notify();
    broadcastAdminUpdate();
  },

  duplicateQuestion: (id: string) => {
    const target = currentQuiz.questions.find((q) => q.id === id);
    if (!target) return;

    const newId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const duplicated: Question = {
      ...target,
      id: newId,
      question: `${target.question} (Copy)`,
      marks: target.marks || 2,
      negativeMarks: 0,
      options: target.options.map((o) => ({ ...o })),
    };

    const targetIndex = currentQuiz.questions.findIndex((q) => q.id === id);
    const newQuestions = [...currentQuiz.questions];
    newQuestions.splice(targetIndex + 1, 0, duplicated);

    currentQuiz = {
      ...currentQuiz,
      questions: newQuestions,
      durationSeconds: newQuestions.length * (currentQuiz.defaultQuestionTime || 20),
    };
    notify();
    broadcastAdminUpdate();
  },

  reorderQuestions: (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      fromIndex >= currentQuiz.questions.length ||
      toIndex < 0 ||
      toIndex >= currentQuiz.questions.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const newQuestions = [...currentQuiz.questions];
    const [moved] = newQuestions.splice(fromIndex, 1);
    newQuestions.splice(toIndex, 0, moved);

    currentQuiz = {
      ...currentQuiz,
      questions: newQuestions,
    };
    notify();
    broadcastAdminUpdate();
  },

  resetToDefault: () => {
    currentQuiz = {
      ...INITIAL_QUIZ,
      status: 'READY',
      startedAt: null,
      endedAt: null,
    };
    notify();
    broadcastAdminUpdate();
  },

  joinQuizByPin: (pin: string): { success: boolean; quiz?: Quiz; error?: string } => {
    const cleanPin = pin.trim();
    if (cleanPin === currentQuiz.pin) {
      joinedQuizId = currentQuiz.id;
      return { success: true, quiz: { ...currentQuiz } };
    }
    return { success: false, error: 'Invalid PIN' };
  },

  getJoinedQuiz: (): Quiz | null => {
    if (joinedQuizId && joinedQuizId === currentQuiz.id) {
      return { ...currentQuiz };
    }
    return null;
  },

  generateQRPayload: (): string => {
    const payload: QuizQRPayload = {
      type: 'QUIZ_JOIN',
      quizId: currentQuiz.id,
      pin: currentQuiz.pin,
    };
    return JSON.stringify(payload);
  },
};
