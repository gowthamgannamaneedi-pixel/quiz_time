import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useQuizSession } from '../../src/hooks/useQuizSession';
import { TimerBadge } from '../../src/components/TimerBadge';
import { OptionCard } from '../../src/components/OptionCard';
import { QuestionNavigator } from '../../src/components/QuestionNavigator';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import { isAdminAuthenticated } from '../../src/utils/adminAuth';

export default function AdminPreviewScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answers,
    markedForReview,
    timeLeft,
    isSubmitted,
    result,
    selectOption,
    toggleReview,
    goToNext,
    goToPrev,
    jumpToQuestion,
    submitQuiz,
  } = useQuizSession(quiz);

  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);

  const handleExit = () => {
    router.replace('/admin');
  };

  if (totalQuestions === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No questions configured to preview.</Text>
          <Button title="RETURN TO ADMIN" onPress={handleExit} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Simulation finished view
  if (isSubmitted && result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {/* Preview Banner */}
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={theme.brandBurgundy} />
          <Text style={styles.previewBannerText}>
            ADMIN PREVIEW — SIMULATION COMPLETED
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Card style={styles.resultCard}>
            <BrandLogo size="md" showText subtitle="College Quiz 2026" style={{ marginBottom: 16 }} />
            <Text style={styles.resultScoreTitle}>PREVIEW SCORE</Text>
            <Text style={styles.resultScoreValue}>
              {result.score} / {result.maxScore}
            </Text>
            <Text style={styles.resultPercentageText}>
              Accuracy: {result.percentage}% • {result.correctCount} Correct, {result.wrongCount} Wrong
            </Text>
          </Card>

          <Button
            title="EXIT ADMIN PREVIEW"
            onPress={handleExit}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;
  const isCurrentMarkedReview = !!markedForReview[currentQuestion?.id || ''];
  const selectedOptionForCurrent = answers[currentQuestion?.id || ''] || null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Prominent Admin Preview Banner */}
      <View style={styles.previewBanner}>
        <Ionicons name="eye" size={16} color={theme.brandBurgundy} />
        <Text style={styles.previewBannerText}>
          ADMIN PREVIEW MODE (SIMULATION)
        </Text>
        <TouchableOpacity onPress={handleExit} style={styles.exitPreviewBtn}>
          <Text style={styles.exitPreviewBtnText}>EXIT</Text>
        </TouchableOpacity>
      </View>

      {/* Top Bar with Brand Logo */}
      <View style={styles.topBar}>
        <BrandLogo size="sm" />
        <TimerBadge secondsRemaining={timeLeft} />
        <TouchableOpacity
          onPress={() => setIsNavigatorOpen(true)}
          style={styles.gridBtn}
        >
          <Ionicons name="grid-outline" size={16} color={theme.brandBurgundy} />
          <Text style={styles.gridBtnText}>
            {currentIndex + 1}/{totalQuestions}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {currentQuestion && (
          <>
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

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleReview(currentQuestion.id)}
                style={[
                  styles.reviewToggle,
                  isCurrentMarkedReview && styles.reviewToggleActive,
                ]}
              >
                <Ionicons
                  name={isCurrentMarkedReview ? 'bookmark' : 'bookmark-outline'}
                  size={15}
                  color={isCurrentMarkedReview ? theme.brandGold : theme.brandTextSecondary}
                />
                <Text
                  style={[
                    styles.reviewToggleText,
                    isCurrentMarkedReview && styles.reviewToggleTextActive,
                  ]}
                >
                  {isCurrentMarkedReview ? 'Marked for Review' : 'Mark for Review'}
                </Text>
              </TouchableOpacity>
            </Card>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((opt) => (
                <OptionCard
                  key={opt.key}
                  optionKey={opt.key}
                  text={opt.text}
                  isSelected={selectedOptionForCurrent === opt.key}
                  onSelect={() => selectOption(currentQuestion.id, opt.key)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomToolbar}>
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            onPress={goToPrev}
            disabled={currentIndex === 0}
            style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-back" size={18} color={theme.brandText} />
            <Text style={styles.navBtnText}>Previous</Text>
          </TouchableOpacity>

          {currentIndex === totalQuestions - 1 ? (
            <TouchableOpacity
              onPress={() => submitQuiz()}
              style={styles.submitCtaBtn}
            >
              <Text style={styles.submitCtaText}>Finish Preview</Text>
              <Ionicons name="checkmark-done" size={18} color={theme.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={goToNext} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <QuestionNavigator
        visible={isNavigatorOpen}
        onClose={() => setIsNavigatorOpen(false)}
        totalQuestions={totalQuestions}
        currentIndex={currentIndex}
        answers={answers}
        markedForReview={markedForReview}
        questionIds={quiz.questions.map((q) => q.id)}
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    textAlign: 'center',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.brandBurgundyLight,
    borderBottomWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  exitPreviewBtn: {
    backgroundColor: theme.brandBurgundy,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exitPreviewBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.white,
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
  gridBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  gridBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandText,
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
  },
  questionStatement: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.brandText,
    lineHeight: 22,
    marginBottom: 12,
  },
  reviewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  reviewToggleActive: {
    backgroundColor: theme.brandGoldSurface,
    borderColor: theme.brandGoldBorder,
  },
  reviewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  reviewToggleTextActive: {
    color: theme.brandGoldText,
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
  navButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brandBurgundy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.white,
  },
  submitCtaBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brandBurgundy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.white,
  },
  resultScroll: {
    padding: 20,
    alignItems: 'center',
  },
  resultCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  resultScoreTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 1,
  },
  resultScoreValue: {
    fontSize: 44,
    fontWeight: '900',
    color: theme.brandText,
    fontFamily: 'monospace',
    marginVertical: 6,
  },
  resultPercentageText: {
    fontSize: 13,
    color: theme.brandTextSecondary,
  },
});
