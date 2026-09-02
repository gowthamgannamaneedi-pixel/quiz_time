import { useState, useEffect, useCallback, useRef } from 'react';
import { Quiz, QuizResult } from '../types/quiz.types';
import { realtimeSession } from '../services/realtimeSession';
import { getStoredStudentName, getOrCreateParticipantId } from '../utils/studentSession';

export const QUESTION_DURATION_SECS = 20;

export const useQuizSession = (quiz: Quiz | null) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D' | null>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const totalQuestions = quiz?.questions.length || 1;
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(QUESTION_DURATION_SECS);

  const timerRef = useRef<any>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const lastAnsweredAtRef = useRef<number>(0);

  const isSubmittedRef = useRef(isSubmitted);
  isSubmittedRef.current = isSubmitted;

  const quizRef = useRef(quiz);
  quizRef.current = quiz;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Initialize state when quiz changes
  useEffect(() => {
    if (quiz) {
      if (quiz.status === 'READY' || quiz.status === 'WAITING') {
        setCurrentIndex(0);
        setAnswers({});
        setMarkedForReview({});
        setIsSubmitted(false);
        setResult(null);
        lastAnsweredAtRef.current = 0;
        setQuestionTimeLeft(QUESTION_DURATION_SECS);
      }
    }
  }, [quiz?.id, quiz?.status]);

  // Submit and scoring calculation
  const submitQuiz = useCallback((): QuizResult | null => {
    const currentQ = quizRef.current;
    if (!currentQ || isSubmittedRef.current) return result;

    // Immediately lock submission to prevent duplicate runs
    isSubmittedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentAnswers = answersRef.current;
    const sessionStartedAt = realtimeSession.getSession().startedAt || currentQ.startedAt || (Date.now() - 20000);
    
    // Real completion time calculation:
    // Uses the exact timestamp when student locked their last answer (or completed)!
    const lastAnswerTime = lastAnsweredAtRef.current > 0
      ? lastAnsweredAtRef.current
      : (realtimeSession.getAuthoritativeServerTime());

    const timeTaken = Math.max(1, Math.round((lastAnswerTime - sessionStartedAt) / 1000));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    currentQ.questions.forEach((q) => {
      const qMarks = typeof q.marks === 'number' ? q.marks : 2;
      maxPossibleScore += qMarks;
      const studentAns = currentAnswers[q.id];

      if (!studentAns) {
        unansweredCount++;
      } else if (String(studentAns).trim().toUpperCase() === String(q.correctAnswer).trim().toUpperCase()) {
        correctCount++;
        totalScore += qMarks;
      } else {
        wrongCount++;
        // No negative marking
      }
    });

    const finalScore = Math.max(0, totalScore);
    const percentage = maxPossibleScore > 0 ? Math.round((finalScore / maxPossibleScore) * 100) : 0;

    const participantId = getOrCreateParticipantId();
    const studentName = getStoredStudentName() || 'Student';

    // Development [QUIZ RESULT DEBUG] log requirements #13 & #17
    console.log('====================================================');
    console.log('[QUIZ RESULT DEBUG]');
    console.log('student:', studentName);
    console.log('participantId:', participantId);
    console.log('attempt:', `attempt_${participantId}`);
    console.log('answers:', currentAnswers);
    console.log('calculated score:', `${finalScore}/${maxPossibleScore}`);
    console.log('total marks:', maxPossibleScore);
    console.log('correctAnswers:', correctCount);
    console.log('wrongAnswers:', wrongCount);
    console.log('unanswered:', unansweredCount);
    console.log('attemptStartedAt:', new Date(sessionStartedAt).toISOString());
    console.log('completedAt:', new Date(lastAnswerTime).toISOString());
    console.log('totalTimeTaken:', `${timeTaken}s (${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s)`);
    console.log('====================================================');

    const calculatedResult: QuizResult = {
      quizId: currentQ.id,
      quizTitle: currentQ.title,
      pin: currentQ.pin,
      totalQuestions: currentQ.questions.length,
      correctCount,
      wrongCount,
      unansweredCount,
      score: finalScore,
      maxScore: maxPossibleScore,
      percentage,
      timeTakenSeconds: timeTaken,
      answers: currentAnswers,
      submittedAt: new Date().toISOString(),
    };

    // Save to Realtime Session Server immediately
    realtimeSession.submitStudentResult(participantId, calculatedResult, studentName);

    setResult(calculatedResult);
    setIsSubmitted(true);
    isSubmittedRef.current = true;
    return calculatedResult;
  }, [result, totalQuestions]);

  // Authoritative Timestamp-Based Question Countdown Loop
  useEffect(() => {
    if (!quiz || isSubmitted) return;

    if (quiz.status !== 'LIVE' || !quiz.startedAt) {
      setQuestionTimeLeft(QUESTION_DURATION_SECS);
      return;
    }

    // Function to compute exact question and remaining seconds from authoritative server time
    const updateAuthoritativeTimer = () => {
      const sessionStarted = realtimeSession.getSession().startedAt || quiz.startedAt;
      if (!sessionStarted || typeof sessionStarted !== 'number' || sessionStarted < 1000000000000) {
        setQuestionTimeLeft(QUESTION_DURATION_SECS);
        return;
      }

      const now = realtimeSession.getAuthoritativeServerTime();
      const elapsedMs = Math.max(0, now - sessionStarted);
      const totalQ = quiz.questions.length;

      if (totalQ === 0) return;

      // Build cumulative schedule based on each question's timeLimit
      let cumulativeMs = 0;
      let activeIndex = 0;
      const firstQSecs = quiz.questions[0]?.timeLimit || quiz.defaultQuestionTime || QUESTION_DURATION_SECS;
      let activeQuestionExpiresAt = sessionStarted + firstQSecs * 1000;

      for (let i = 0; i < totalQ; i++) {
        const qSecs = quiz.questions[i]?.timeLimit || quiz.defaultQuestionTime || QUESTION_DURATION_SECS;
        const qMs = qSecs * 1000;
        const qEndMs = cumulativeMs + qMs;

        if (elapsedMs < qEndMs) {
          activeIndex = i;
          activeQuestionExpiresAt = sessionStarted + qEndMs;
          cumulativeMs = qEndMs;
          break;
        }
        cumulativeMs = qEndMs;
        if (i === totalQ - 1) {
          activeIndex = totalQ - 1;
        }
      }

      // ONLY finalize if elapsed time has genuinely exceeded the entire quiz duration
      if (elapsedMs >= cumulativeMs && cumulativeMs > 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        submitQuiz();
        return;
      }

      if (activeIndex !== currentIndexRef.current) {
        setCurrentIndex(activeIndex);
      }

      const remainingSecs = Math.max(0, Math.ceil((activeQuestionExpiresAt - now) / 1000));
      setQuestionTimeLeft(remainingSecs);
    };

    // Initial check on mount/update (protects against refresh/reconnect reset!)
    updateAuthoritativeTimer();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(updateAuthoritativeTimer, 400);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [quiz?.status, quiz?.startedAt, isSubmitted, submitQuiz]);

  // Answer selection with instant lock & backend save
  const selectOption = useCallback((questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmittedRef.current) return;
    // ANSWER LOCKING: Once an answer is selected for this question, it CANNOT be changed
    if (answersRef.current[questionId]) return;

    const nowTime = realtimeSession.getAuthoritativeServerTime();
    lastAnsweredAtRef.current = nowTime;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));

    const participantId = getOrCreateParticipantId();
    const studentName = getStoredStudentName() || 'Student';
    realtimeSession.saveAnswer(participantId, questionId, optionKey, studentName);
  }, []);

  // Navigation and review helper methods (used in preview and drawer)
  const toggleReview = useCallback((questionId: string) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  const goToNext = useCallback(() => {
    const totalQ = quizRef.current?.questions.length || 0;
    setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const jumpToQuestion = useCallback((index: number) => {
    const totalQ = quizRef.current?.questions.length || 0;
    if (index >= 0 && index < totalQ) {
      setCurrentIndex(index);
    }
  }, []);

  const currentQuestion = quiz?.questions[currentIndex] || null;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;

  return {
    currentIndex,
    currentQuestion,
    totalQuestions: quiz?.questions.length || 0,
    answers,
    markedForReview,
    timeLeft: questionTimeLeft,
    perQuestionDuration: QUESTION_DURATION_SECS,
    isSubmitted,
    result,
    answeredCount,
    reviewCount,
    selectOption,
    toggleReview,
    goToNext,
    goToPrev,
    jumpToQuestion,
    submitQuiz,
  };
};
