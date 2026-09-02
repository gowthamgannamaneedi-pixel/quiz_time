import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import { getStoredStudentName, getOrCreateParticipantId } from '../../src/utils/studentSession';

export default function StudentReadyScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();
  const { status: sessionStatus, session, registerStudent } = useRealtimeSession();

  // Active authoritative questions
  const activeQuestions = (session.questions && session.questions.length > 0) ? session.questions : quiz.questions;
  const totalQuestions = activeQuestions.length;
  const totalMarks = activeQuestions.reduce((acc, q) => acc + q.marks, 0);

  // Register this student device with the real-time server on mount
  useEffect(() => {
    const studentName = getStoredStudentName() || 'Student';
    const participantId = getOrCreateParticipantId();
    registerStudent(studentName, participantId);
  }, []);

  // AUTOMATIC TRANSITION: The moment Admin triggers START QUIZ (status becomes 'LIVE'),
  // all connected student screens automatically navigate to the live examination screen.
  useEffect(() => {
    if (sessionStatus === 'LIVE') {
      router.replace('/student/quiz');
    }
  }, [sessionStatus]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (secs === 0) return `${mins}`;
    return `${mins}m ${secs}s`;
  };

  if (sessionStatus === 'ENDED') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          showBack
          title="Quiz Concluded"
          onBackPress={() => router.replace('/student')}
        />
        <View style={styles.endedContainer}>
          <View style={styles.endedIconCircle}>
            <Ionicons name="stop-circle" size={44} color={theme.danger} />
          </View>
          <Text style={styles.endedTitle}>QUIZ ENDED</Text>
          <Text style={styles.endedSubtitle}>
            This examination has been concluded by the administrator. New entries are closed.
          </Text>
          <Button
            title="RETURN TO PORTAL"
            onPress={() => router.replace('/student')}
            style={{ marginTop: 20, minWidth: 200 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Student Waiting Room"
        onBackPress={() => router.replace('/student')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Waiting Room Hero Card with Brand Logo */}
        <Card style={styles.waitingHeroCard}>
          <View style={styles.brandHeroBox}>
            <BrandLogo size="md" />
            <Text style={styles.clubBrandText}>NIAT ADVANCE TECH CLUB</Text>
          </View>

          <View style={styles.joinedBadgeRow}>
            <View style={styles.joinedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={theme.success} />
              <Text style={styles.joinedBadgeText}>✓ QUIZ JOINED</Text>
            </View>
            <View style={styles.disabledStatusBadge}>
              <Text style={styles.disabledStatusText}>WAITING</Text>
            </View>
          </View>

          <View style={styles.pulsingIndicatorBox}>
            <ActivityIndicator size="small" color={theme.brandGold} />
            <Text style={styles.waitingStatusText}>WAITING FOR ADMIN</Text>
          </View>

          <Text style={styles.quizTitleHero}>{session.title || quiz.title}</Text>

          <View style={styles.studentInfoPill}>
            <Ionicons name="person-circle-outline" size={18} color={theme.brandBurgundy} />
            <Text style={styles.studentInfoLabel}>Student:</Text>
            <Text style={styles.studentInfoName}>{getStoredStudentName() || 'Student'}</Text>
          </View>

          <Text style={styles.waitingNoticeSub}>
            Status: Waiting for the quiz to start... Please keep this screen open.
          </Text>
        </Card>

        {/* Quiz Overview Card */}
        <Card style={styles.headerCard}>
          <View style={styles.badgeRow}>
            <View style={styles.pinBadge}>
              <Text style={styles.pinBadgeText}>PIN: {session.pin || quiz.pin}</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{session.category || quiz.category || 'NIAT ADVANCE TECH CLUB'}</Text>
            </View>
          </View>

          <Text style={styles.quizTitle}>{session.title || quiz.title}</Text>
          {quiz.description ? (
            <Text style={styles.quizDesc}>{quiz.description}</Text>
          ) : null}
        </Card>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={22} color={theme.brandTextSecondary} />
            <Text style={styles.statValue}>{formatDuration(totalQuestions * 20)}</Text>
            <Text style={styles.statLabel}>MINUTES</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="help-circle-outline" size={22} color={theme.brandBurgundy} />
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>QUESTIONS</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="trophy-outline" size={22} color={theme.brandGold} />
            <Text style={styles.statValue}>{totalMarks}</Text>
            <Text style={styles.statLabel}>MAX MARKS</Text>
          </View>
        </View>

        {/* Rules Card */}
        <Card style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Examination Protocol</Text>

          <View style={styles.ruleItem}>
            <Ionicons name="lock-closed" size={18} color={theme.brandGold} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Admin-Controlled Start:</Text> The official countdown timer starts from the Admin Start Event.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="shield-checkmark" size={18} color={theme.brandBurgundy} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Auto-Save:</Text> All your selected answers are saved continuously in real time.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="timer-outline" size={18} color={theme.success} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Automatic Submission:</Text> When the synchronized timer reaches 00:00, your exam will automatically submit.
            </Text>
          </View>
        </Card>

        {/* Start / Waiting Action Button */}
        {sessionStatus === 'LIVE' ? (
          <Button
            title="START LIVE QUIZ NOW"
            onPress={() => router.replace('/student/quiz')}
            style={{ marginTop: 8 }}
            icon={<Ionicons name="play-circle" size={22} color={theme.white} />}
          />
        ) : (
          <Button
            title="WAITING FOR ADMIN TO START"
            disabled
            onPress={() => {}}
            style={{ marginTop: 8, opacity: 0.6 }}
            icon={<Ionicons name="hourglass-outline" size={20} color={theme.brandTextSecondary} />}
          />
        )}
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
    gap: 16,
    paddingBottom: 36,
  },
  waitingHeroCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    textAlign: 'center',
    padding: 20,
  },
  brandHeroBox: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorder,
    width: '100%',
  },
  clubBrandText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.8,
  },
  joinedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.successSurface,
    borderColor: theme.successBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  joinedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.successText,
    letterSpacing: 0.5,
  },
  disabledStatusBadge: {
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  disabledStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  pulsingIndicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.brandGoldSurface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.brandGoldBorder,
  },
  waitingStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandGoldText,
    letterSpacing: 1,
  },
  quizTitleHero: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.brandText,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  studentInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    marginBottom: 10,
  },
  studentInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  studentInfoName: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandText,
  },
  waitingNoticeSub: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  headerCard: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  pinBadge: {
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pinBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
  },
  categoryBadge: {
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.brandText,
    lineHeight: 26,
    marginBottom: 6,
  },
  quizDesc: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandText,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  rulesCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  ruleText: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    flex: 1,
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
    color: theme.brandText,
  },
  endedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  endedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: theme.dangerBorder,
  },
  endedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  endedSubtitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});
