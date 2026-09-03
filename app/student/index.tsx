import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PinInput } from '../../src/components/PinInput';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Header } from '../../src/components/Header';
import { BrandLogo } from '../../src/components/BrandLogo';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { realtimeSession } from '../../src/services/realtimeSession';
import { quizStore } from '../../src/store/quizStore';
import { theme } from '../../src/theme/colors';
import {
  getStoredStudentName,
  setStoredStudentName,
  createFreshParticipantId,
  validateStudentName,
} from '../../src/utils/studentSession';
import { unlockAudio } from '../../src/utils/soundEffects';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { pin: officialPin, title: quizTitle, registerStudent } = useRealtimeSession();

  const [studentName, setStudentName] = useState(getStoredStudentName() || '');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredStudentName();
    if (stored && !studentName) {
      setStudentName(stored);
    }
  }, []);

  const handleJoinByPin = async (pinToValidate?: string) => {
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
    const backendPin = freshSession.pin || officialPin || quizStore.getQuiz().pin || '';

    const targetPin = pinToValidate || pin;
    const cleanEntered = String(targetPin || '').trim().replace(/\s+/g, '');
    const cleanBackend = String(backendPin || '').trim().replace(/\s+/g, '');
    const isMatch = cleanEntered.length === 6 && cleanEntered === cleanBackend && cleanEntered !== '000000';

    if (!isMatch) {
      setErrorMsg('Invalid Quiz PIN');
      return;
    }

    // Save Name & Register Fresh Participant Attempt
    setStoredStudentName(nameVal.cleanName);
    const participantId = createFreshParticipantId();
    registerStudent(nameVal.cleanName, participantId);
    quizStore.joinQuizByPin(cleanEntered);

    // Valid PIN! Joined successfully. Navigate to Student Waiting Room
    router.push('/student/ready');
  };

  const handleOpenScanner = () => {
    unlockAudio();
    setErrorMsg(null);
    const nameVal = validateStudentName(studentName);
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.error || 'Please enter your Full Name before scanning.');
      return;
    }
    setStoredStudentName(nameVal.cleanName);
    router.push('/student/scan');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        showBack
        title="Student Portal"
        onBackPress={() => router.replace('/')}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Official Event Branding Banner */}
          <View style={styles.brandingBanner}>
            <BrandLogo size="md" showText subtitle="College Quiz 2026" />
          </View>

          {/* Main PIN & Name Entry Card */}
          <Card style={styles.mainCard}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="school-outline" size={22} color={theme.brandBurgundy} />
              <Text style={styles.cardTitle}>Student Participation</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Enter your full name and the 6-digit PIN projected on the screen
            </Text>

            {/* Student Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
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

            {/* PIN Entry */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>QUIZ PIN</Text>
              <PinInput
                pin={pin}
                onChangePin={(text) => {
                  setPin(text);
                  setErrorMsg(null);
                }}
                onComplete={(completedPin) => {
                  handleJoinByPin(completedPin);
                }}
                error={!!errorMsg}
              />
            </View>

            {errorMsg && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <Button
              title="JOIN QUIZ NOW"
              onPress={() => handleJoinByPin()}
              disabled={pin.trim().length !== 6 || !studentName.trim()}
              style={styles.joinButton}
              icon={<Ionicons name="arrow-forward-circle" size={20} color={theme.white} />}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* QR Scanner Button */}
            <Button
              title="SCAN QR CODE"
              variant="scanner"
              onPress={handleOpenScanner}
              icon={<Ionicons name="qr-code-outline" size={20} color={theme.white} />}
            />
          </Card>

          {/* Active Event PIN Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleJoinByPin(officialPin)}
            style={styles.currentQuizHint}
          >
            <Text style={styles.hintLabel}>Active Event PIN:</Text>
            <Text style={styles.hintPin}>{officialPin}</Text>
            <Text style={styles.hintTitle} numberOfLines={1}>({quizTitle})</Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.success} />
            <Text style={styles.footerText}>
              Real-time synchronization • Live auditorium participant
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.brandBackground,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '85%',
  },
  brandingBanner: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  mainCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.brandText,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    marginBottom: 16,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.dangerSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.dangerBorder,
    marginBottom: 12,
    width: '100%',
  },
  errorText: {
    color: theme.dangerText,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  joinButton: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.brandBorder,
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.brandTextMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  currentQuizHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  hintPin: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hintTitle: {
    fontSize: 11,
    color: theme.brandTextSecondary,
    flex: 1,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    fontWeight: '500',
  },
});
