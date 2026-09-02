import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import {
  getStoredStudentName,
  getOrCreateParticipantId,
  createFreshParticipantId,
} from '../../src/utils/studentSession';

export default function StudentResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score: string;
    maxScore: string;
    correctCount: string;
    wrongCount: string;
    unansweredCount: string;
    percentage: string;
    timeTakenSeconds: string;
    quizTitle: string;
    pin: string;
    answers?: string;
  }>();

  const { quiz } = useAdminQuiz();
  const { leaderboard, fetchLeaderboard } = useRealtimeSession();
  const [showReview, setShowReview] = useState(false);

  const studentName = getStoredStudentName() || 'You';
  const participantId = getOrCreateParticipantId();

  // Fetch latest leaderboard on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  let userAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null> = {};
  if (params.answers) {
    try {
      userAnswers = JSON.parse(params.answers);
    } catch {
      // ignore
    }
  }

  const score = parseInt(params.score || '0', 10);
  const maxScore = parseInt(params.maxScore || '40', 10);
  const correctCount = parseInt(params.correctCount || '0', 10);
  const wrongCount = parseInt(params.wrongCount || '0', 10);
  const unansweredCount = parseInt(params.unansweredCount || '0', 10);
  const percentage = parseInt(params.percentage || '0', 10);
  const timeTaken = parseInt(params.timeTakenSeconds || '0', 10);

  const formatDuration = (seconds: number) => {
    const s = typeof seconds === 'number' && !isNaN(seconds) && seconds > 0 ? Math.round(seconds) : 0;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isPassed = percentage >= 50;

  // Find student rank in leaderboard
  const studentEntry = leaderboard.find((e) => e.participantId === participantId);
  const currentRank = studentEntry ? studentEntry.rank : 1;
  const liveScore = studentEntry && typeof studentEntry.score === 'number' ? studentEntry.score : score;
  const liveMaxScore = studentEntry && typeof studentEntry.maxScore === 'number' ? studentEntry.maxScore : maxScore;
  const liveTime = studentEntry && typeof studentEntry.timeTakenSeconds === 'number' ? studentEntry.timeTakenSeconds : timeTaken;
  const isProvisional = leaderboard.length < 5;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Result Header Hero with Brand Logo */}
        <View style={styles.heroSection}>
          <BrandLogo size="md" showText subtitle="College Quiz 2026" style={{ marginBottom: 14 }} />

          <View style={[styles.trophyCircle, isPassed ? styles.trophyPass : styles.trophyFail]}>
            <Ionicons
              name={isPassed ? 'trophy' : 'ribbon-outline'}
              size={40}
              color={isPassed ? theme.brandGold : theme.brandBurgundy}
            />
          </View>

          <Text style={styles.completionTitle}>QUIZ COMPLETED!</Text>
          <Text style={styles.quizTitle} numberOfLines={2}>
            {params.quizTitle || quiz.title}
          </Text>

          {/* Student Performance Banner */}
          <Card style={styles.performanceBannerCard}>
            <View style={styles.bannerRankCol}>
              <Text style={styles.bannerLabel}>YOUR RANK</Text>
              <Text style={styles.bannerRankValue}>#{currentRank}</Text>
              {isProvisional && (
                <Text style={styles.provisionalTag}>PROVISIONAL</Text>
              )}
            </View>

            <View style={styles.bannerDivider} />

            <View style={styles.bannerScoreCol}>
              <Text style={styles.bannerLabel}>YOUR SCORE</Text>
              <Text style={styles.bannerScoreValue}>{liveScore}/{liveMaxScore}</Text>
              <Text style={styles.bannerAccuracy}>{percentage}% Accuracy</Text>
            </View>

            <View style={styles.bannerDivider} />

            <View style={styles.bannerTimeCol}>
              <Text style={styles.bannerLabel}>COMPLETION TIME</Text>
              <Text style={styles.bannerTimeValue}>{formatDuration(liveTime)}</Text>
              <Text style={styles.bannerTimeSub}>Official Time</Text>
            </View>
          </Card>
        </View>

        {/* 🏆 TOP 5 LEADERBOARD */}
        <Card style={styles.leaderboardCard}>
          <View style={styles.lbHeaderRow}>
            <View style={styles.lbHeaderLeft}>
              <Ionicons name="trophy" size={20} color={theme.brandGold} />
              <Text style={styles.lbTitle}>TOP 5 LEADERBOARD</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <View style={styles.lbTable}>
            <View style={styles.lbTableHeader}>
              <Text style={[styles.lbTh, styles.thRank]}>RANK</Text>
              <Text style={[styles.lbTh, styles.thName]}>STUDENT</Text>
              <Text style={[styles.lbTh, styles.thScore]}>SCORE</Text>
              <Text style={[styles.lbTh, styles.thTime]}>TIME</Text>
            </View>

            {leaderboard.length === 0 ? (
              // Fallback to current student row while sync is in progress
              <View style={[styles.lbRow, styles.lbRowHighlight]}>
                <View style={styles.rankCell}>
                  <View style={[styles.rankMedal, styles.goldMedal]}>
                    <Text style={styles.rankMedalText}>1</Text>
                  </View>
                </View>
                <Text style={[styles.lbNameText, styles.lbNameHighlight]} numberOfLines={1}>
                  {studentName} (You)
                </Text>
                <Text style={styles.lbScoreText}>{score}/{maxScore}</Text>
                <Text style={styles.lbTimeText}>{formatDuration(timeTaken)}</Text>
              </View>
            ) : (
              leaderboard.slice(0, 5).map((entry) => {
                const isCurrent = entry.participantId === participantId;
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <View
                    key={entry.participantId}
                    style={[styles.lbRow, isCurrent && styles.lbRowHighlight]}
                  >
                    <View style={styles.rankCell}>
                      <View
                        style={[
                          styles.rankMedal,
                          isTop1 && styles.goldMedal,
                          isTop2 && styles.silverMedal,
                          isTop3 && styles.bronzeMedal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankMedalText,
                            (isTop1 || isTop2 || isTop3) && styles.rankMedalTextTop,
                          ]}
                        >
                          {entry.rank}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.nameCell}>
                      <Text
                        style={[styles.lbNameText, isCurrent && styles.lbNameHighlight]}
                        numberOfLines={1}
                      >
                        {entry.studentName} {isCurrent ? '(You)' : ''}
                      </Text>
                    </View>

                    <Text style={styles.lbScoreText}>
                      {entry.score}/{entry.maxScore}
                    </Text>

                    <Text style={styles.lbTimeText}>
                      {formatDuration(entry.timeTakenSeconds)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </Card>

        {/* 4 Performance Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.correctCard]}>
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            <Text style={styles.metricVal}>{correctCount}</Text>
            <Text style={styles.metricLabel}>CORRECT</Text>
          </View>

          <View style={[styles.metricCard, styles.wrongCard]}>
            <Ionicons name="close-circle" size={22} color={theme.danger} />
            <Text style={styles.metricVal}>{wrongCount}</Text>
            <Text style={styles.metricLabel}>WRONG</Text>
          </View>

          <View style={[styles.metricCard, styles.unansweredCard]}>
            <Ionicons name="remove-circle-outline" size={22} color={theme.brandTextSecondary} />
            <Text style={styles.metricVal}>{unansweredCount}</Text>
            <Text style={styles.metricLabel}>SKIPPED</Text>
          </View>

          <View style={[styles.metricCard, styles.timeCard]}>
            <Ionicons name="time-outline" size={22} color={theme.brandBurgundy} />
            <Text style={styles.metricVal}>{formatDuration(timeTaken)}</Text>
            <Text style={styles.metricLabel}>TIME USED</Text>
          </View>
        </View>

        {/* Question Review Section */}
        {quiz.questions.length > 0 && (
          <View style={styles.reviewSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowReview(!showReview)}
              style={styles.reviewToggleBtn}
            >
              <View style={styles.reviewBtnLeft}>
                <Ionicons name="list-outline" size={18} color={theme.brandBurgundy} />
                <Text style={styles.reviewBtnText}>Review Answer Key & Explanation</Text>
              </View>
              <Ionicons
                name={showReview ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.brandTextSecondary}
              />
            </TouchableOpacity>

            {showReview && (
              <View style={styles.questionsList}>
                {quiz.questions.map((q, idx) => {
                  const studentChoice = userAnswers[q.id];
                  const isCorrect = studentChoice === q.correctAnswer;
                  const isSkipped = !studentChoice;

                  return (
                    <Card key={q.id} style={styles.reviewQuestionCard}>
                      <View style={styles.qHeaderRow}>
                        <Text style={styles.reviewQIndex}>QUESTION {idx + 1}</Text>
                        
                        {isSkipped ? (
                          <View style={styles.skippedBadge}>
                            <Text style={styles.skippedBadgeText}>Skipped (0 pts)</Text>
                          </View>
                        ) : isCorrect ? (
                          <View style={styles.correctBadge}>
                            <Ionicons name="checkmark-circle" size={14} color={theme.success} />
                            <Text style={styles.correctBadgeText}>+{q.marks} pts</Text>
                          </View>
                        ) : (
                          <View style={styles.wrongBadge}>
                            <Ionicons name="close-circle" size={14} color={theme.danger} />
                            <Text style={styles.wrongBadgeText}>Wrong (0 pts)</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.reviewQText}>{q.question}</Text>

                      <View style={styles.reviewOptionsCol}>
                        {q.options.map((opt) => {
                          const isCorrectOption = opt.key === q.correctAnswer;
                          const isChosen = studentChoice === opt.key;

                          return (
                            <View
                              key={opt.key}
                              style={[
                                styles.reviewOptionRow,
                                isCorrectOption && styles.reviewOptionCorrect,
                                isChosen && !isCorrectOption && styles.reviewOptionWrong,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.reviewOptionKey,
                                  isCorrectOption && styles.reviewOptionKeyCorrect,
                                  isChosen && !isCorrectOption && styles.reviewOptionKeyWrong,
                                ]}
                              >
                                {opt.key}
                              </Text>
                              <Text
                                style={[
                                  styles.reviewOptionText,
                                  isCorrectOption && styles.reviewOptionTextCorrect,
                                  isChosen && !isCorrectOption && styles.reviewOptionTextWrong,
                                ]}
                              >
                                {opt.text}
                              </Text>

                              {isCorrectOption && (
                                <Text style={styles.correctLabelText}>CORRECT ANSWER</Text>
                              )}
                              {isChosen && !isCorrectOption && (
                                <Text style={styles.wrongLabelText}>YOUR CHOICE</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Home CTA */}
        <View style={styles.actionsContainer}>
          <Button
            title="TAKE ANOTHER QUIZ"
            onPress={() => {
              createFreshParticipantId();
              router.replace('/student');
            }}
            style={styles.primaryActionBtn}
            icon={<Ionicons name="home-outline" size={20} color={theme.white} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.brandBackground,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  trophyPass: {
    backgroundColor: theme.brandGoldSurface,
    borderColor: theme.brandGoldBorder,
  },
  trophyFail: {
    backgroundColor: theme.dangerSurface,
    borderColor: theme.dangerBorder,
  },
  completionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.5,
  },
  quizTitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 320,
  },
  performanceBannerCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  bannerRankCol: {
    flex: 1,
    alignItems: 'center',
  },
  bannerScoreCol: {
    flex: 1.2,
    alignItems: 'center',
  },
  bannerTimeCol: {
    flex: 1.2,
    alignItems: 'center',
  },
  bannerDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.brandBorder,
  },
  bannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bannerRankValue: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandGold,
  },
  provisionalTag: {
    fontSize: 8,
    fontWeight: '800',
    color: theme.brandGoldText,
    backgroundColor: theme.brandGoldSurface,
    borderWidth: 1,
    borderColor: theme.brandGoldBorder,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  bannerScoreValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  bannerAccuracy: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    marginTop: 2,
  },
  bannerTimeValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  bannerTimeSub: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.brandTextSecondary,
    marginTop: 2,
  },
  leaderboardCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  lbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lbHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lbTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.successBorder,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.successText,
    letterSpacing: 0.5,
  },
  lbTable: {
    gap: 6,
  },
  lbTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorder,
  },
  lbTh: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  thRank: {
    width: 44,
  },
  thName: {
    flex: 1,
  },
  thScore: {
    width: 60,
    textAlign: 'center',
  },
  thTime: {
    width: 65,
    textAlign: 'right',
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  lbRowHighlight: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundyBorder,
  },
  rankCell: {
    width: 44,
    alignItems: 'flex-start',
  },
  rankMedal: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldMedal: {
    backgroundColor: theme.brandGoldSurface,
    borderWidth: 1,
    borderColor: theme.brandGoldBorder,
  },
  silverMedal: {
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  bronzeMedal: {
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  rankMedalText: {
    fontSize: 11,
    fontWeight: '900',
    color: theme.brandTextSecondary,
    fontFamily: 'monospace',
  },
  rankMedalTextTop: {
    color: theme.brandGoldText,
  },
  nameCell: {
    flex: 1,
    paddingRight: 6,
  },
  lbNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandText,
  },
  lbNameHighlight: {
    color: theme.brandBurgundy,
    fontWeight: '800',
  },
  lbScoreText: {
    width: 60,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandText,
    textAlign: 'center',
  },
  lbTimeText: {
    width: 65,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    textAlign: 'right',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  correctCard: {
    borderColor: theme.successBorder,
  },
  wrongCard: {
    borderColor: theme.dangerBorder,
  },
  unansweredCard: {
    borderColor: theme.brandBorder,
  },
  timeCard: {
    borderColor: theme.brandBorder,
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandText,
    marginVertical: 3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  reviewBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandText,
  },
  questionsList: {
    marginTop: 10,
    gap: 10,
  },
  reviewQuestionCard: {
    backgroundColor: theme.white,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 14,
  },
  qHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewQIndex: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
  },
  correctBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.successBorder,
  },
  correctBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.successText,
  },
  wrongBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.dangerSurface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
  },
  wrongBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.dangerText,
  },
  skippedBadge: {
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  skippedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  reviewQText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.brandText,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewOptionsCol: {
    gap: 6,
  },
  reviewOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.brandSurfaceLight,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  reviewOptionCorrect: {
    backgroundColor: theme.successSurface,
    borderColor: theme.successBorder,
  },
  reviewOptionWrong: {
    backgroundColor: theme.dangerSurface,
    borderColor: theme.dangerBorder,
  },
  reviewOptionKey: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    width: 16,
  },
  reviewOptionKeyCorrect: {
    color: theme.successText,
  },
  reviewOptionKeyWrong: {
    color: theme.dangerText,
  },
  reviewOptionText: {
    fontSize: 13,
    color: theme.brandText,
    flex: 1,
  },
  reviewOptionTextCorrect: {
    color: theme.brandText,
    fontWeight: '700',
  },
  reviewOptionTextWrong: {
    color: theme.brandText,
    fontWeight: '700',
  },
  correctLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.successText,
    backgroundColor: theme.successSurface,
    borderWidth: 1,
    borderColor: theme.successBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wrongLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.dangerText,
    backgroundColor: theme.dangerSurface,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryActionBtn: {
    width: '100%',
  },
});
