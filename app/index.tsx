import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../src/hooks/useAdminQuiz';
import { BrandLogo } from '../src/components/BrandLogo';
import { theme } from '../src/theme/colors';

export default function StartScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* App Branding with Official Logo */}
        <View style={styles.brandHeader}>
          <BrandLogo size="lg" showText subtitle="College Quiz 2026" />
        </View>

        {/* Mode Selector Cards */}
        <View style={styles.modesContainer}>
          {/* 1. ADMIN MODE CARD */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/admin')}
            style={[styles.modeCard, styles.adminCard]}
          >
            <View style={styles.cardIconCircle}>
              <Ionicons name="shield-checkmark" size={26} color={theme.brandBurgundy} />
            </View>
            <View style={styles.cardTextContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.modeTitle}>ADMIN MODE</Text>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>CONTROL PANEL</Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>
                Customize quiz settings, questions, custom timer, generate QR code & launch live quiz.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.brandTextSecondary} />
          </TouchableOpacity>

          {/* 2. STUDENT MODE CARD */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/student')}
            style={[styles.modeCard, styles.studentCard]}
          >
            <View style={styles.cardIconCircle}>
              <Ionicons name="school" size={26} color={theme.brandBurgundy} />
            </View>
            <View style={styles.cardTextContainer}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.modeTitle}>STUDENT MODE</Text>
                <View style={styles.studentBadge}>
                  <Text style={styles.studentBadgeText}>EXAM PORTAL</Text>
                </View>
              </View>
              <Text style={styles.modeDesc}>
                Join quiz via 6-digit PIN or scan QR code. Take quiz with authoritative timer & auto-save.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.brandTextSecondary} />
          </TouchableOpacity>
        </View>

        {/* Current Config Summary Card */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryHeader}>
            <Ionicons name="information-circle-outline" size={16} color={theme.brandTextSecondary} />
            <Text style={styles.summaryHeaderText}>Configured Quiz: {quiz.title}</Text>
          </View>
          <View style={styles.summaryPills}>
            <Text style={styles.summaryPill}>PIN: {quiz.pin}</Text>
            <Text style={styles.summaryPill}>{quiz.questions.length} Questions</Text>
            <Text style={styles.summaryPill}>{Math.round(quiz.durationSeconds / 60)} Mins</Text>
          </View>
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
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  modesContainer: {
    width: '100%',
    maxWidth: 440,
    gap: 16,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    backgroundColor: theme.white,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  adminCard: {
    backgroundColor: theme.white,
  },
  studentCard: {
    backgroundColor: theme.white,
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.brandBurgundyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.3,
  },
  adminBadge: {
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  studentBadge: {
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  studentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  modeDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    lineHeight: 18,
  },
  summaryBox: {
    marginTop: 32,
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  summaryPills: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  summaryPill: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.brandText,
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
});
