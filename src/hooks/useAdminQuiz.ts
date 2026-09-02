import { useState, useEffect } from 'react';
import { quizStore } from '../store/quizStore';
import { Quiz } from '../types/quiz.types';

export const useAdminQuiz = () => {
  const [quiz, setQuiz] = useState<Quiz>(quizStore.getQuiz());

  useEffect(() => {
    const unsubscribe = quizStore.subscribe((updated) => {
      setQuiz(updated);
    });
    return unsubscribe;
  }, []);

  return {
    quiz,
    updateQuizSettings: quizStore.updateQuizSettings,
    updateDuration: quizStore.updateDuration,
    updateDefaultQuestionTime: quizStore.updateDefaultQuestionTime,
    updateStatus: quizStore.updateStatus,
    openWaitingRoom: quizStore.openWaitingRoom,
    startLiveQuiz: quizStore.startLiveQuiz,
    endLiveQuiz: quizStore.endLiveQuiz,
    resetQuizSession: quizStore.resetQuizSession,
    addQuestion: quizStore.addQuestion,
    updateQuestion: quizStore.updateQuestion,
    deleteQuestion: quizStore.deleteQuestion,
    duplicateQuestion: quizStore.duplicateQuestion,
    reorderQuestions: quizStore.reorderQuestions,
    resetToDefault: quizStore.resetToDefault,
  };
};
