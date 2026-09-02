import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { realtimeSession } from '../../src/services/realtimeSession';
import { useQuizSession } from '../../src/hooks/useQuizSession';
import { TimerBadge } from '../../src/components/TimerBadge';
import { OptionCard } from '../../src/components/OptionCard';
import { QuestionNavigator } from '../../src/components/QuestionNavigator';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import { getOrCreateParticipantId, getStoredStudentName } from '../../src/utils/studentSession';

export default function StudentQuizScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();
  const { session } = useRealtimeSession();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  // Authoritative Single Source of Truth for Quiz & Questions
  const activeQuestions = (session.questions && session.questions.length > 0)
    ? session.questions
    : quiz.questions;

  const activeQuiz = {
    ...quiz,
    questions: activeQuestions,
    category: session.category || quiz.category || 'NIAT ADVANCE TECH CLUB',
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds || (activeQuestions.length * 20),
  };

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answers,
    markedForReview,
    timeLeft,
    isSubmitted,
    result,
    answeredCount,
    selectOption,
    jumpToQuestion,
    submitQuiz,
  } = useQuizSession(activeQuiz);

  // Guard: Student cannot enter or remain in examination if Admin has not started the quiz
  useEffect(() => {
    if (session.status === 'WAITING' || session.status === 'READY' || session.status === 'DRAFT') {
      router.replace('/student/ready');
    }
  }, [session.status]);

  // When Admin ends live quiz while student is in exam, finalize attempt
  useEffect(() => {
    if (session.status === 'ENDED' && !isSubmitted) {
      submitQuiz();
    }
  }, [session.status, isSubmitted, submitQuiz]);

  // When submitted, notify server and navigate to Result screen
  useEffect(() => {
    if (isSubmitted && result) {
      const pid = getOrCreateParticipantId();
      const sName = getStoredStudentName() || 'Student';
      realtimeSession.submitStudentResult(pid, result, sName);

      router.replace({
        pathname: '/student/result',
        params: {
          score: String(result.score),
          maxScore: String(result.maxScore),
          correctCount: String(result.correctCount),
          wrongCount: String(result.wrongCount),
          unansweredCount: String(result.unansweredCount),
          percentage: String(result.percentage),
          timeTakenSeconds: String(result.timeTakenSeconds),
          quizTitle: result.quizTitle,
          pin: result.pin,
          answers: JSON.stringify(result.answers || {}),
        },
      });
    }
  }, [isSubmitted, result]);

  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No questions configured for this quiz.</Text>
          <Button
            title="RETURN TO HOME"
            onPress={() => router.replace('/student')}
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const executeSubmit = () => {
    setShowSubmitModal(false);
    setShowExitModal(false);
    submitQuiz();
  };

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;
  const selectedOptionForCurrent = answers[currentQuestion.id] || null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Examination Bar: [NIAT LOGO]    ⏱ 00:20    1/6 */}
      <View style={styles.topBar}>
        <View style={styles.topBarBrandCol}>
          <BrandLogo size="sm" />
        </View>

        {/* Live Authoritative 20-Second Question Timer */}
        <TimerBadge secondsRemaining={timeLeft} />

        {/* Question Counter Badge e.g. 1/6 */}
        <View style={styles.qCounterBadge}>
          <Text style={styles.qCounterText}>
            {currentIndex + 1}/{totalQuestions}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Question Header & Statement: QUESTION 1 OF 6 */}
        <Card style={styles.questionCard}>
          <View style={styles.questionMetaRow}>
            <View style={styles.qNumBadge}>
              <Text style={styles.qNumText}>
                QUESTION {currentIndex + 1} OF {totalQuestions}
              </Text>
            </View>
          </View>

          <Text style={styles.questionStatement}>
            {currentQuestion.question}
          </Text>

          {/* Locked Answer Banner */}
          {selectedOptionForCurrent ? (
            <View style={styles.answerLockedBadge}>
              <Ionicons name="lock-closed" size={16} color={theme.success} />
              <Text style={styles.answerLockedText}>
                Answer Locked (Option {selectedOptionForCurrent})
              </Text>
            </View>
          ) : (
            <View style={styles.selectPromptBadge}>
              <Ionicons name="finger-print-outline" size={16} color={theme.brandBurgundy} />
              <Text style={styles.selectPromptText}>
                Select an option ({timeLeft}s left)
              </Text>
            </View>
          )}
        </Card>

        {/* MCQ Options A, B, C, D */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((opt) => (
            <OptionCard
              key={opt.key}
              optionKey={opt.key}
              text={opt.text}
              isSelected={selectedOptionForCurrent === opt.key}
              isLocked={!!selectedOptionForCurrent}
              disabled={!!selectedOptionForCurrent}
              onSelect={() => selectOption(currentQuestion.id, opt.key)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Auto-Advance Status Toolbar */}
      <View style={styles.bottomToolbar}>
        <View style={[styles.autoAdvanceBanner, !!selectedOptionForCurrent && styles.autoAdvanceBannerLocked]}>
          <View style={[styles.autoAdvanceIconCircle, !!selectedOptionForCurrent && styles.autoAdvanceIconCircleLocked]}>
            <Ionicons
              name={selectedOptionForCurrent ? "lock-closed" : "timer-outline"}
              size={18}
              color={selectedOptionForCurrent ? theme.success : theme.brandBurgundy}
            />
          </View>
          <View style={styles.autoAdvanceTextCol}>
            <Text style={styles.autoAdvanceTitle}>
              {selectedOptionForCurrent
                ? (currentIndex < totalQuestions - 1
                    ? `Next question in ${timeLeft}s`
                    : `Finalizing quiz in ${timeLeft}s`)
                : (currentIndex < totalQuestions - 1
                    ? `Time remaining: ${timeLeft}s`
                    : `Final question: ${timeLeft}s remaining`)}
            </Text>
            <Text style={styles.autoAdvanceSubtitle}>
              {selectedOptionForCurrent
                ? 'Your answer is locked and saved.'
                : 'Tap an option to lock your answer.'}
            </Text>
          </View>
        </View>
      </View>

      {/* In-App Confirmation Modal: SUBMIT QUIZ */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="checkmark-done" size={30} color={theme.success} />
            </View>
            <Text style={styles.modalTitle}>Submit Quiz?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to submit your answers? You will not be able to change them afterwards.
            </Text>

            {totalQuestions - answeredCount > 0 && (
              <View style={styles.unansweredNoticeBox}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.warning} />
                <Text style={styles.unansweredNoticeText}>
                  {totalQuestions - answeredCount} question{totalQuestions - answeredCount > 1 ? 's are' : ' is'} left unanswered.
                </Text>
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <Button
                title="CANCEL"
                variant="secondary"
                onPress={() => setShowSubmitModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="SUBMIT"
                onPress={executeSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* In-App Confirmation Modal: EXIT QUIZ */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: theme.dangerSurface, borderColor: theme.dangerBorder }]}>
              <Ionicons name="exit-outline" size={30} color={theme.danger} />
            </View>
            <Text style={styles.modalTitle}>Exit Examination?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to leave? Your answers will be submitted now and your exam will conclude.
            </Text>

            <View style={styles.modalActionsRow}>
              <Button
                title="CANCEL"
                variant="secondary"
                onPress={() => setShowExitModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="SUBMIT & EXIT"
                variant="danger"
                onPress={executeSubmit}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Question Navigator Drawer */}
      <QuestionNavigator
        visible={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        totalQuestions={totalQuestions}
        currentIndex={currentIndex}
        answers={answers}
        markedForReview={markedForReview}
        questionIds={activeQuestions.map((q) => q.id)}
        onSelectQuestion={jumpToQuestion}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.brandBackground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorder,
  },
  topBarBrandCol: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  progressBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: theme.brandBorder,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.brandBurgundy,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  questionCard: {
    backgroundColor: theme.white,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  questionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qNumBadge: {
    backgroundColor: theme.brandBurgundyLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  qNumText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  questionStatement: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.brandText,
    lineHeight: 24,
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  bottomToolbar: {
    backgroundColor: theme.white,
    borderTopWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: theme.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 25, 35, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.successSurface,
    borderWidth: 1.5,
    borderColor: theme.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandText,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  unansweredNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.warningSurface,
    borderColor: theme.warningBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  unansweredNoticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.warningText,
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  qCounterBadge: {
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  qCounterText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandText,
    fontFamily: 'monospace',
  },
  answerLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.successSurface,
    borderColor: theme.success,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  answerLockedText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.successText,
    letterSpacing: 0.3,
  },
  selectPromptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  selectPromptText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  autoAdvanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  autoAdvanceBannerLocked: {
    backgroundColor: theme.successSurface,
    borderColor: theme.success,
  },
  autoAdvanceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.brandBurgundyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoAdvanceIconCircleLocked: {
    backgroundColor: theme.successSurface,
  },
  autoAdvanceTextCol: {
    flex: 1,
  },
  autoAdvanceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandText,
    letterSpacing: 0.2,
  },
  autoAdvanceSubtitle: {
    fontSize: 11,
    color: theme.brandTextSecondary,
    marginTop: 2,
  },
});
