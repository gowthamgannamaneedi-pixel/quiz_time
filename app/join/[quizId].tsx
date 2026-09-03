import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { realtimeSession } from '../../src/services/realtimeSession';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { PinInput } from '../../src/components/PinInput';
import { theme } from '../../src/theme/colors';
import {
  getStoredStudentName,
  setStoredStudentName,
  createFreshParticipantId,
  validateStudentName,
} from '../../src/utils/studentSession';
import { unlockAudio } from '../../src/utils/soundEffects';

export default function UniversalQuizJoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ quizId: string; pin?: string }>();
  const targetQuizId = Array.isArray(params.quizId) ? params.quizId[0] : params.quizId;
  const initialPin = Array.isArray(params.pin) ? params.pin[0] : params.pin || '';

  const { quiz } = useAdminQuiz();
  const { pin: officialPin, status: sessionStatus, session, registerStudent } = useRealtimeSession();

  const [studentName, setStudentName] = useState(getStoredStudentName() || '');
  const [enteredPin, setEnteredPin] = useState(initialPin || officialPin || '');
  const [isJoined, setIsJoined] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate matching quiz ID
  const isMatchingQuiz = !targetQuizId || targetQuizId === quiz.id || targetQuizId === session.quizId;

  // Auto-fill pin if param updates
  useEffect(() => {
    if (initialPin) {
      setEnteredPin(initialPin);
    }
  }, [initialPin]);

  // Auto-transition when Admin launches LIVE exam
  useEffect(() => {
    if (isJoined && sessionStatus === 'LIVE') {
      router.replace('/student/quiz');
    }
  }, [isJoined, sessionStatus]);

  const handlePerformJoin = async (pinToSubmit?: string) => {
    unlockAudio();
    setErrorMsg(null);

    // 1. Validate Student Name
    const nameVal = validateStudentName(studentName);
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.error || 'Please enter your Full Name.');
      return;
    }

    // 2. Fetch authoritative quiz session directly from shared backend
    const freshSession = await realtimeSession.fetchSessionDirectly();
    const backendPin = freshSession.pin || officialPin || quiz.pin || '';

    const pinToTest = pinToSubmit || enteredPin;
    const cleanEntered = String(pinToTest || '').trim().replace(/\s+/g, '');
    const cleanBackend = String(backendPin || '').trim().replace(/\s+/g, '');
    const isMatch = cleanEntered.length === 6 && cleanEntered === cleanBackend && cleanEntered !== '000000';

    if (!isMatch) {
      setErrorMsg('Invalid Quiz PIN');
      return;
    }

    setStoredStudentName(nameVal.cleanName);
    const participantId = createFreshParticipantId();

    try {
      registerStudent(nameVal.cleanName, participantId);
      setIsJoined(true);
      router.replace('/student/ready');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join session.');
    }
  };

  const handleOpenAppDeepLink = async () => {
    const customSchemeUrl = `syncquiz://join/${encodeURIComponent(targetQuizId || quiz.id)}?pin=${encodeURIComponent(enteredPin || quiz.pin)}`;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = customSchemeUrl;
      } else {
        await Linking.openURL(customSchemeUrl);
      }
    } catch {
      // ignore
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
    if (mins > 0) return `${mins} mins`;
    return `${secs} secs`;
  };

  if (!isMatchingQuiz && targetQuizId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header showBack title="Join Quiz Event" onBackPress={() => router.replace('/student')} />
        <View style={styles.errorCenterContainer}>
          <View style={styles.errorIconCircle}>
            <Ionicons name="alert-circle" size={44} color={theme.brandBurgundy} />
          </View>
          <Text style={styles.errorTitleText}>Quiz Event Not Found</Text>
          <Text style={styles.errorSubText}>
            The link you opened belongs to &quot;{targetQuizId}&quot;, but the current active event is &quot;{quiz.id}&quot;.
          </Text>
          <Button
            title="GO TO ACTIVE EVENT"
            onPress={() => router.replace(`/join/${quiz.id}` as any)}
            style={{ marginTop: 20, width: '100%', maxWidth: 300 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Official Quiz Entry"
        onBackPress={() => router.replace('/student')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isJoined ? (
          /* Waiting Room State after joining */
          <>
            <Card style={styles.waitingHeroCard}>
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

              <Text style={styles.quizTitleHero}>{quiz.title}</Text>
              <Text style={styles.waitingNoticeSub}>
                The quiz will begin when the administrator starts it. Please keep this screen open.
              </Text>
            </Card>

            <Card style={styles.quizDetailCard}>
              <Text style={styles.sectionHeading}>Event Summary</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PIN Code:</Text>
                <Text style={styles.detailValuePin}>{quiz.pin}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Questions:</Text>
                <Text style={styles.detailValue}>{quiz.questions.length} MCQs</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration:</Text>
                <Text style={styles.detailValue}>{formatDuration(quiz.durationSeconds)}</Text>
              </View>
            </Card>
          </>
        ) : (
          /* Join Card before joining */
          <>
            <Card style={styles.joinHeroCard}>
              <BrandLogo size="md" showText subtitle="College Quiz 2026" style={{ marginBottom: 14 }} />

              <View style={styles.heroBadgeRow}>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>OFFICIAL EVENT</Text>
                </View>
                <Text style={styles.categoryText}>{quiz.category}</Text>
              </View>

              <Text style={styles.quizTitleHero}>{quiz.title}</Text>
              {quiz.description ? (
                <Text style={styles.quizDescText}>{quiz.description}</Text>
              ) : null}

              {/* Stats Bar */}
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Ionicons name="time-outline" size={15} color={theme.brandTextSecondary} />
                  <Text style={styles.statPillText}>{formatDuration(quiz.durationSeconds)}</Text>
                </View>

                <View style={styles.statPill}>
                  <Ionicons name="help-circle-outline" size={15} color={theme.brandBurgundy} />
                  <Text style={styles.statPillText}>{quiz.questions.length} Questions</Text>
                </View>

                <View style={styles.statPill}>
                  <Ionicons name="trophy-outline" size={15} color={theme.brandGold} />
                  <Text style={styles.statPillText}>
                    {quiz.questions.reduce((acc, q) => acc + q.marks, 0)} Marks
                  </Text>
                </View>
              </View>
            </Card>

            {/* PIN Validation Card */}
            <Card style={styles.pinCard}>
              <Text style={styles.pinCardTitle}>Confirm 6-Digit Quiz PIN</Text>
              <Text style={styles.pinCardSub}>
                Enter your name and confirm the 6-digit PIN to join this session
              </Text>

              {/* Student Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>YOUR FULL NAME</Text>
                <View style={styles.nameInputWrapper}>
                  <Ionicons name="person-outline" size={18} color={theme.brandTextSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.nameInput}
                    placeholder="e.g. Rahul Kumar"
                    placeholderTextColor={theme.brandTextMuted}
                    value={studentName}
                    onChangeText={(text) => {
                      setStudentName(text);
                      setErrorMsg(null);
                    }}
                    autoCapitalize="words"
                    maxLength={50}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PIN</Text>
                <PinInput
                  pin={enteredPin}
                  onChangePin={(text) => {
                    setEnteredPin(text);
                    setErrorMsg(null);
                  }}
                  onComplete={(completedPin) => {
                    handlePerformJoin(completedPin);
                  }}
                  error={!!errorMsg}
                />
              </View>

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={theme.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <Button
                title="JOIN QUIZ NOW"
                onPress={() => handlePerformJoin()}
                disabled={enteredPin.trim().length !== 6 || !studentName.trim()}
                style={styles.joinBtn}
                icon={<Ionicons name="arrow-forward-circle" size={20} color={theme.white} />}
              />

              {/* Web Browser Deep Link Option */}
              {Platform.OS === 'web' && (
                <Button
                  title="OPEN IN SYNCQUIZ APP"
                  variant="secondary"
                  onPress={handleOpenAppDeepLink}
                  style={styles.appOpenBtn}
                  icon={<Ionicons name="open-outline" size={18} color={theme.brandTextSecondary} />}
                />
              )}
            </Card>
          </>
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
  joinHeroCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  liveBadge: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundyBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  categoryText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    fontWeight: '600',
  },
  quizTitleHero: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.brandText,
    lineHeight: 26,
    marginBottom: 6,
  },
  quizDescText: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandText,
  },
  pinCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  pinCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 4,
  },
  pinCardSub: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginBottom: 14,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.dangerSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    marginVertical: 10,
  },
  errorText: {
    color: theme.dangerText,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  joinBtn: {
    marginTop: 10,
  },
  appOpenBtn: {
    marginTop: 10,
  },
  waitingHeroCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    textAlign: 'center',
    padding: 20,
  },
  joinedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
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
  waitingNoticeSub: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  quizDetailCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: theme.brandBorderLight,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: theme.brandText,
    fontWeight: '700',
  },
  detailValuePin: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: theme.brandBurgundy,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.dangerSurface,
    borderWidth: 1.5,
    borderColor: theme.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  inputGroup: {
    marginBottom: 14,
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  nameInput: {
    flex: 1,
    color: theme.brandText,
    fontSize: 14,
    fontWeight: '600',
  },
});
