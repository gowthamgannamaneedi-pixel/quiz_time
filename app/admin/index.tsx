import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
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
import { isAdminAuthenticated, verifyAdminPassword, logoutAdmin } from '../../src/utils/adminAuth';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();
  const {
    pin: sessionPin,
    status: sessionStatus,
    connectedStudents,
    participants,
    leaderboard,
    fetchLeaderboard,
    openWaitingRoom,
    startLiveQuiz,
    endLiveQuiz,
    resetSession,
    updateSettings,
  } = useRealtimeSession();

  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [showEndQuizModal, setShowEndQuizModal] = useState(false);
  const displayPin = sessionPin || quiz.pin;

  // Fetch latest leaderboard on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchLeaderboard();
    }
  }, [isAuthenticated]);

  // Ensure Admin PIN is synchronized with real-time backend
  useEffect(() => {
    if (quiz.pin && sessionPin && quiz.pin !== sessionPin) {
      updateSettings({ pin: quiz.pin, title: quiz.title, description: quiz.description, category: quiz.category });
    }
  }, [quiz.pin, sessionPin]);

  const handleAdminLogin = () => {
    setAuthError(null);
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setAuthError('Please enter the Admin password.');
      return;
    }

    const success = verifyAdminPassword(trimmed);
    if (success) {
      setIsAuthenticated(true);
      setPasswordInput('');
      setAuthError(null);
    } else {
      setAuthError('Incorrect password. Access denied.');
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAuthenticated(false);
    setPasswordInput('');
    setAuthError(null);
  };

  const formatDuration = (totalSeconds: number) => {
    const s = typeof totalSeconds === 'number' && !isNaN(totalSeconds) && totalSeconds > 0 ? Math.round(totalSeconds) : 0;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const completedCount = participants.filter((p) => p.status === 'SUBMITTED').length;
  const liveCount = participants.filter((p) => p.status === 'LIVE').length;

  const handleOpenWaitingRoom = () => {
    openWaitingRoom();
  };

  const handleStartLiveQuizConfirm = () => {
    if (quiz.questions.length === 0) {
      Alert.alert('Cannot Start Quiz', 'Please add at least one question in Question Management.');
      return;
    }
    startLiveQuiz();
  };

  const handleEndQuizConfirm = () => {
    setShowEndQuizModal(true);
  };

  const executeEndQuiz = () => {
    setShowEndQuizModal(false);
    endLiveQuiz();
  };

  const getStatusBadgeStyle = () => {
    switch (sessionStatus) {
      case 'LIVE':
        return { bg: theme.successSurface, text: theme.successText, border: theme.successBorder, label: 'LIVE' };
      case 'WAITING':
        return {
          bg: theme.brandGoldSurface,
          text: theme.brandGoldText,
          border: theme.brandGoldBorder,
          label: connectedStudents > 0
            ? `STUDENTS CONNECTED: ${connectedStudents}`
            : 'WAITING FOR STUDENTS',
        };
      case 'READY':
        return { bg: theme.brandSurfaceLight, text: theme.brandText, border: theme.brandBorder, label: 'READY' };
      case 'ENDED':
        return { bg: theme.dangerSurface, text: theme.dangerText, border: theme.dangerBorder, label: 'ENDED' };
      default:
        return { bg: theme.brandSurfaceLight, text: theme.brandTextSecondary, border: theme.brandBorder, label: 'DRAFT' };
    }
  };

  const statusStyle = getStatusBadgeStyle();

  // 1. Unauthenticated Admin Challenge View
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header
          showBack
          title="Admin Authentication"
          onBackPress={() => router.replace('/')}
        />

        <ScrollView contentContainerStyle={styles.loginScrollContent}>
          <Card style={styles.loginCard}>
            <BrandLogo size="md" showText subtitle="College Quiz 2026" style={{ marginBottom: 16 }} />

            <View style={styles.lockIconCircle}>
              <Ionicons name="shield-checkmark" size={32} color={theme.brandBurgundy} />
            </View>

            <Text style={styles.loginTitle}>ADMINISTRATOR ACCESS</Text>
            <Text style={styles.loginSubtitle}>
              Restricted Area. Enter your 6-digit administrator password to access the control center.
            </Text>

            <View style={styles.passwordInputContainer}>
              <Ionicons name="key-outline" size={18} color={theme.brandTextSecondary} style={styles.passwordIcon} />
              <TextInput
                value={passwordInput}
                onChangeText={(text) => {
                  setPasswordInput(text);
                  if (authError) setAuthError(null);
                }}
                secureTextEntry={!showPassword}
                keyboardType="number-pad"
                maxLength={12}
                placeholder="Enter password..."
                placeholderTextColor={theme.brandTextMuted}
                style={styles.passwordInput}
                onSubmitEditing={handleAdminLogin}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.brandTextSecondary}
                />
              </TouchableOpacity>
            </View>

            {authError && (
              <View style={styles.authErrorPill}>
                <Ionicons name="alert-circle" size={14} color={theme.danger} />
                <Text style={styles.authErrorText}>{authError}</Text>
              </View>
            )}

            <Button
              title="UNLOCK ADMIN PANEL"
              onPress={handleAdminLogin}
              style={{ width: '100%', marginTop: 8 }}
              icon={<Ionicons name="lock-open-outline" size={18} color={theme.white} />}
            />

            <Button
              title="RETURN TO HOME"
              variant="secondary"
              onPress={() => router.replace('/')}
              style={{ width: '100%', marginTop: 10 }}
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Authenticated Admin Dashboard View
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Admin Control Center"
        onBackPress={() => router.replace('/')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Dashboard Hero Card with Brand Logo */}
        <Card style={styles.dashboardHeroCard}>
          <View style={styles.brandHeroBanner}>
            <BrandLogo size="md" />
            <Text style={styles.clubBrandText}>NIAT ADVANCE TECH CLUB</Text>
            
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleAdminLogout}
              style={styles.lockPanelBtn}
            >
              <Ionicons name="lock-closed" size={13} color={theme.brandBurgundy} />
              <Text style={styles.lockPanelBtnText}>Lock</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
              <Text style={styles.quizTitle} numberOfLines={2}>
                {quiz.title}
              </Text>
              <Text style={styles.quizCategory}>{quiz.category}</Text>
            </View>

            <View style={styles.pinBox}>
              <Text style={styles.pinLabel}>QUIZ PIN</Text>
              <Text style={styles.pinValue}>{displayPin}</Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="help-circle-outline" size={18} color={theme.brandBurgundy} />
              <Text style={styles.metricValue}>{quiz.questions.length}</Text>
              <Text style={styles.metricLabel}>QUESTIONS</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={18} color={theme.brandTextSecondary} />
              <Text style={styles.metricValue}>{quiz.defaultQuestionTime || 20} SEC</Text>
              <Text style={styles.metricLabel}>PER QUESTION</Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="trophy-outline" size={18} color={theme.brandGold} />
              <Text style={styles.metricValue}>
                {quiz.questions.reduce((acc, q) => acc + q.marks, 0)}
              </Text>
              <Text style={styles.metricLabel}>TOTAL MARKS</Text>
            </View>
          </View>
        </Card>

        {/* Action Controls Grid */}
        <Text style={styles.sectionHeader}>ADMIN CONTROLS</Text>

        <View style={styles.controlsGrid}>
          {/* 1. EDIT QUIZ SETTINGS */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin/quiz-settings')}
            style={styles.controlCard}
          >
            <View style={styles.controlIconCircle}>
              <Ionicons name="create-outline" size={22} color={theme.brandBurgundy} />
            </View>
            <View style={styles.controlTextCol}>
              <Text style={styles.controlTitle}>EDIT QUIZ</Text>
              <Text style={styles.controlDesc}>Title, description & PIN code</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.brandTextSecondary} />
          </TouchableOpacity>

          {/* 2. QUESTION MANAGEMENT */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin/questions')}
            style={styles.controlCard}
          >
            <View style={styles.controlIconCircle}>
              <Ionicons name="list-circle-outline" size={22} color={theme.brandBurgundy} />
            </View>
            <View style={styles.controlTextCol}>
              <Text style={styles.controlTitle}>QUESTIONS ({quiz.questions.length})</Text>
              <Text style={styles.controlDesc}>Add, edit, duplicate & reorder MCQs</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.brandTextSecondary} />
          </TouchableOpacity>

          {/* 3. TIMER CONFIGURATION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin/timer')}
            style={styles.controlCard}
          >
            <View style={styles.controlIconCircle}>
              <Ionicons name="timer-outline" size={22} color={theme.brandBurgundy} />
            </View>
            <View style={styles.controlTextCol}>
              <Text style={styles.controlTitle}>TIMER SETTINGS</Text>
              <Text style={styles.controlDesc}>Per-question timing & presets</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.brandTextSecondary} />
          </TouchableOpacity>

          {/* 4. QR CODE GENERATOR */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin/qr')}
            style={styles.controlCard}
          >
            <View style={styles.controlIconCircle}>
              <Ionicons name="qr-code-outline" size={22} color={theme.brandBurgundy} />
            </View>
            <View style={styles.controlTextCol}>
              <Text style={styles.controlTitle}>QR / SCANNER CODE</Text>
              <Text style={styles.controlDesc}>Display event QR code for auditorium</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.brandTextSecondary} />
          </TouchableOpacity>

          {/* 5. PREVIEW QUIZ */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/admin/preview')}
            style={styles.controlCard}
          >
            <View style={styles.controlIconCircle}>
              <Ionicons name="eye-outline" size={22} color={theme.brandBurgundy} />
            </View>
            <View style={styles.controlTextCol}>
              <Text style={styles.controlTitle}>PREVIEW AS STUDENT</Text>
              <Text style={styles.controlDesc}>Test full quiz UI before going live</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.brandTextSecondary} />
          </TouchableOpacity>
        </View>

        {/* Live Quiz Status & Session Action Panel */}
        <Text style={styles.sectionHeader}>LIVE SESSION CONTROL</Text>

        <Card style={styles.liveControlCard}>
          <View style={styles.sessionStatusHeader}>
            <View style={styles.statusIndicatorRow}>
              <View style={[styles.statusDotLarge, { backgroundColor: statusStyle.text }]} />
              <Text style={styles.sessionStatusHeading}>
                SESSION STATUS: {sessionStatus}
              </Text>
            </View>

            <View style={styles.participantsBadge}>
              <Ionicons name="people" size={16} color={theme.brandBurgundy} />
              <Text style={styles.participantsBadgeText}>
                {connectedStudents} Connected
              </Text>
            </View>
          </View>

          <View style={styles.sessionStatsGrid}>
            <View style={styles.sessionStatItem}>
              <Text style={styles.sessionStatNum}>{connectedStudents}</Text>
              <Text style={styles.sessionStatLabel}>JOINED</Text>
            </View>
            <View style={styles.sessionStatItem}>
              <Text style={[styles.sessionStatNum, { color: theme.brandBurgundy }]}>{liveCount}</Text>
              <Text style={styles.sessionStatLabel}>IN PROGRESS</Text>
            </View>
            <View style={styles.sessionStatItem}>
              <Text style={[styles.sessionStatNum, { color: theme.success }]}>{completedCount}</Text>
              <Text style={styles.sessionStatLabel}>COMPLETED</Text>
            </View>
          </View>

          {/* Dynamic Action Buttons according to session state */}
          <View style={styles.actionButtonsContainer}>
            {sessionStatus === 'READY' && (
              <>
                <Button
                  title="OPEN WAITING ROOM FOR STUDENTS"
                  onPress={handleOpenWaitingRoom}
                  style={styles.primaryActionBtn}
                  icon={<Ionicons name="enter-outline" size={20} color={theme.white} />}
                />
                <Button
                  title="START LIVE QUIZ NOW"
                  onPress={handleStartLiveQuizConfirm}
                  style={[styles.secondaryActionBtn, { marginTop: 10 }]}
                  icon={<Ionicons name="play-circle" size={20} color={theme.white} />}
                />
              </>
            )}

            {sessionStatus === 'WAITING' && (
              <>
                <Button
                  title="START LIVE QUIZ SESSION"
                  onPress={handleStartLiveQuizConfirm}
                  style={styles.startLiveBtn}
                  icon={<Ionicons name="play-circle" size={22} color={theme.white} />}
                />
                <Button
                  title="RESET TO READY"
                  variant="secondary"
                  onPress={resetSession}
                  style={{ marginTop: 10 }}
                />
              </>
            )}

            {sessionStatus === 'LIVE' && (
              <>
                <View style={styles.liveQuizRunningBanner}>
                  <Ionicons name="radio" size={20} color={theme.success} />
                  <Text style={styles.liveQuizRunningText}>
                    Quiz is currently LIVE. Questions auto-advance every 20s.
                  </Text>
                </View>

                <Button
                  title="END QUIZ FOR ALL STUDENTS"
                  variant="danger"
                  onPress={handleEndQuizConfirm}
                  style={{ marginTop: 10 }}
                  icon={<Ionicons name="stop-circle" size={20} color={theme.white} />}
                />
              </>
            )}

            {sessionStatus === 'ENDED' && (
              <>
                <View style={styles.endedBanner}>
                  <Ionicons name="flag" size={20} color={theme.danger} />
                  <Text style={styles.endedBannerText}>
                    Quiz has concluded. Final results are tabulated below.
                  </Text>
                </View>

                <Button
                  title="RESET SESSION TO READY"
                  onPress={resetSession}
                  style={{ marginTop: 10 }}
                  icon={<Ionicons name="refresh" size={20} color={theme.white} />}
                />
              </>
            )}
          </View>
        </Card>

        {/* Real-Time Leaderboard Card */}
        <View style={styles.leaderboardSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>REAL-TIME TOP 5 LEADERBOARD</Text>
            <TouchableOpacity onPress={() => fetchLeaderboard()} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={14} color={theme.brandBurgundy} />
              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.leaderboardCard}>
            {leaderboard.length === 0 ? (
              <View style={styles.emptyLeaderboard}>
                <Ionicons name="trophy-outline" size={36} color={theme.brandTextSecondary} />
                <Text style={styles.emptyLeaderboardText}>
                  No submissions yet. Once students submit their exams, rankings will appear here in real time.
                </Text>
              </View>
            ) : (
              <View style={styles.leaderboardTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { width: 44 }]}>RANK</Text>
                  <Text style={[styles.thText, { flex: 1 }]}>STUDENT NAME</Text>
                  <Text style={[styles.thText, { width: 80, textAlign: 'center' }]}>SCORE</Text>
                  <Text style={[styles.thText, { width: 70, textAlign: 'right' }]}>TIME</Text>
                </View>

                {leaderboard.slice(0, 5).map((entry, index) => {
                  const isFirst = index === 0;
                  return (
                    <View
                      key={entry.participantId}
                      style={[
                        styles.tableRow,
                        isFirst && styles.tableRowFirst,
                      ]}
                    >
                      <View style={[styles.rankBadge, isFirst && styles.rankBadgeFirst]}>
                        <Text style={[styles.rankText, isFirst && styles.rankTextFirst]}>
                          #{entry.rank}
                        </Text>
                      </View>

                      <Text style={[styles.studentNameCell, isFirst && styles.studentNameCellFirst]} numberOfLines={1}>
                        {entry.studentName}
                      </Text>

                      <Text style={styles.scoreCell}>
                        <Text style={styles.scoreNum}>{entry.score}</Text>
                        <Text style={styles.scoreDenom}>/{entry.maxScore}</Text>
                      </Text>

                      <Text style={styles.timeCell}>
                        {formatDuration(entry.timeTakenSeconds)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </View>

        {/* Live Participants Roster */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionHeader}>
            CONNECTED PARTICIPANTS ({participants.length})
          </Text>

          <Card style={styles.participantsCard}>
            {participants.length === 0 ? (
              <View style={styles.emptyParticipants}>
                <Ionicons name="people-outline" size={32} color={theme.brandTextSecondary} />
                <Text style={styles.emptyParticipantsText}>
                  No students connected yet. Students will appear here as soon as they enter the PIN or scan the QR code.
                </Text>
              </View>
            ) : (
              <View style={styles.participantsList}>
                {participants.map((p, idx) => {
                  const isSubmitted = p.status === 'SUBMITTED';
                  const isLive = p.status === 'LIVE';

                  return (
                    <View key={p.participantId} style={styles.participantRow}>
                      <View style={styles.participantInfoCol}>
                        <Text style={styles.participantIndex}>{idx + 1}.</Text>
                        <Text style={styles.participantName} numberOfLines={1}>
                          {p.name}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.pStatusBadge,
                          {
                            backgroundColor: isSubmitted
                              ? theme.successSurface
                              : isLive
                              ? theme.brandBurgundyLight
                              : theme.brandGoldSurface,
                            borderColor: isSubmitted
                              ? theme.successBorder
                              : isLive
                              ? theme.brandBurgundyBorder
                              : theme.brandGoldBorder,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.pStatusText,
                            {
                              color: isSubmitted
                                ? theme.successText
                                : isLive
                                ? theme.brandBurgundy
                                : theme.brandGoldText,
                            },
                          ]}
                        >
                          {p.status}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Confirmation Modal: END QUIZ */}
      <Modal
        visible={showEndQuizModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndQuizModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <Card style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="warning" size={28} color={theme.danger} />
            </View>
            <Text style={styles.modalTitle}>End Quiz for Everyone?</Text>
            <Text style={styles.modalMessage}>
              This will immediately submit exams for all active students and compute the final rankings.
            </Text>

            <View style={styles.modalActionsRow}>
              <Button
                title="CANCEL"
                variant="secondary"
                onPress={() => setShowEndQuizModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="CONFIRM END"
                variant="danger"
                onPress={executeEndQuiz}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.brandBackground,
  },
  loginScrollContent: {
    padding: 24,
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1.5,
    borderColor: theme.brandBurgundyBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 52,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  passwordIcon: {
    marginRight: 10,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
    color: theme.brandText,
    letterSpacing: 2,
  },
  eyeBtn: {
    padding: 6,
  },
  authErrorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.dangerSurface,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  authErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.dangerText,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  dashboardHeroCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    padding: 20,
  },
  brandHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorder,
  },
  clubBrandText: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.8,
    flex: 1,
    marginLeft: 10,
  },
  lockPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  lockPanelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.brandText,
    lineHeight: 26,
    marginBottom: 4,
  },
  quizCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  pinBox: {
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1.5,
    borderColor: theme.brandBurgundyBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 1,
    marginBottom: 2,
  },
  pinValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    letterSpacing: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.brandBorderLight,
    paddingTop: 14,
    gap: 8,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.brandSurfaceLight,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandText,
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandText,
    letterSpacing: 0.8,
    marginVertical: 4,
  },
  controlsGrid: {
    gap: 10,
  },
  controlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  controlIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.brandBurgundyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  controlTextCol: {
    flex: 1,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 2,
  },
  controlDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
  },
  liveControlCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    padding: 18,
  },
  sessionStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDotLarge: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionStatusHeading: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.5,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  sessionStatsGrid: {
    flexDirection: 'row',
    backgroundColor: theme.brandSurfaceLight,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    marginBottom: 16,
  },
  sessionStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  sessionStatNum: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  sessionStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    gap: 8,
  },
  primaryActionBtn: {
    backgroundColor: theme.brandBurgundy,
  },
  secondaryActionBtn: {
    backgroundColor: theme.brandBurgundy,
  },
  startLiveBtn: {
    backgroundColor: theme.success,
  },
  liveQuizRunningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.successSurface,
    borderWidth: 1,
    borderColor: theme.successBorder,
    padding: 12,
    borderRadius: 12,
  },
  liveQuizRunningText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.successText,
    flex: 1,
  },
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.dangerSurface,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    padding: 12,
    borderRadius: 12,
  },
  endedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.dangerText,
    flex: 1,
  },
  leaderboardSection: {
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  leaderboardCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    padding: 12,
  },
  emptyLeaderboard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyLeaderboardText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 18,
  },
  leaderboardTable: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorder,
    paddingBottom: 8,
    marginBottom: 6,
  },
  thText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.brandBorderLight,
  },
  tableRowFirst: {
    backgroundColor: theme.brandGoldSurface,
    borderRadius: 8,
    paddingHorizontal: 6,
    marginVertical: 2,
    borderColor: theme.brandGoldBorder,
    borderWidth: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeFirst: {
    backgroundColor: theme.brandGold,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandText,
  },
  rankTextFirst: {
    color: theme.white,
  },
  studentNameCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandText,
  },
  studentNameCellFirst: {
    fontWeight: '900',
    color: theme.brandGoldText,
  },
  scoreCell: {
    width: 80,
    textAlign: 'center',
  },
  scoreNum: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
  },
  scoreDenom: {
    fontSize: 11,
    color: theme.brandTextSecondary,
  },
  timeCell: {
    width: 70,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.brandTextSecondary,
  },
  participantsSection: {
    marginTop: 6,
  },
  participantsCard: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    padding: 12,
  },
  emptyParticipants: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 6,
  },
  emptyParticipantsText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  participantsList: {
    gap: 6,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  participantInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 10,
  },
  participantIndex: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandTextSecondary,
    width: 20,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandText,
    flex: 1,
  },
  pStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    backgroundColor: theme.dangerSurface,
    borderWidth: 1.5,
    borderColor: theme.dangerBorder,
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
    marginBottom: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
