import { useState, useCallback } from 'react';
import { LOCAL_QUIZZES } from '../data/quizzes';
import { Quiz } from '../types/quiz.types';

export const useQuiz = () => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  const getQuizByPin = useCallback((pin: string): Quiz | null => {
    const cleanPin = pin.trim();
    return LOCAL_QUIZZES.find((q) => q.pin === cleanPin) || null;
  }, []);

  const validatePin = useCallback((pin: string): { isValid: boolean; quiz: Quiz | null; error: string | null } => {
    const cleanPin = pin.trim();

    if (!cleanPin) {
      return { isValid: false, quiz: null, error: 'Please enter a 6-digit Quiz PIN.' };
    }

    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      return { isValid: false, quiz: null, error: 'PIN must be exactly 6 numeric digits.' };
    }

    const quiz = LOCAL_QUIZZES.find((q) => q.pin === cleanPin);

    if (!quiz) {
      return {
        isValid: false,
        quiz: null,
        error: `No quiz found for PIN ${cleanPin}. Please check the event display screen.`,
      };
    }

    return { isValid: true, quiz, error: null };
  }, []);

  return {
    allQuizzes: LOCAL_QUIZZES,
    activeQuiz,
    setActiveQuiz,
    getQuizByPin,
    validatePin,
  };
};
