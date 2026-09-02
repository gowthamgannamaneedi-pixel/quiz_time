import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import { isAdminAuthenticated } from '../../src/utils/adminAuth';

const PRESETS = [
  { label: '10 sec', seconds: 10 },
  { label: '15 sec', seconds: 15 },
  { label: '20 sec', seconds: 20 },
  { label: '30 sec', seconds: 30 },
  { label: '45 sec', seconds: 45 },
  { label: '60 sec', seconds: 60 },
  { label: '90 sec', seconds: 90 },
];

export default function TimerSettingsScreen() {
  const router = useRouter();
  const { quiz, updateDefaultQuestionTime } = useAdminQuiz();

  const [questionSeconds, setQuestionSeconds] = useState(
    String(quiz.defaultQuestionTime || 20)
  );

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  useEffect(() => {
    const current = quiz.defaultQuestionTime || 20;
    setQuestionSeconds(String(current));
  }, [quiz.defaultQuestionTime]);

  const applyPreset = (secs: number) => {
    setQuestionSeconds(String(secs));
  };

  const handleSave = () => {
    const parsedS = parseInt(questionSeconds, 10);

    if (isNaN(parsedS) || parsedS < 5 || parsedS > 300) {
      Alert.alert('Invalid Duration', 'Please set question time between 5 and 300 seconds.');
      return;
    }

    updateDefaultQuestionTime(parsedS);
    Alert.alert(
      'Question Timer Saved',
      `Default question timer is set to ${parsedS} seconds per question.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const selectedNum = parseInt(questionSeconds || '20', 10);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Question Timer Configuration" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title & Description with Brand Logo */}
        <View style={styles.headerInfo}>
          <BrandLogo size="sm" showText subtitle="College Quiz 2026" style={{ marginBottom: 12 }} />
          <Text style={styles.pageTitle}>QUESTION TIMER SETTINGS</Text>
          <Text style={styles.pageSubtitle}>
            Set the time allowed for each question.
          </Text>
        </View>

        {/* Default Question Time Configuration */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>DEFAULT QUESTION TIME</Text>
          <Text style={styles.sectionDesc}>
            Each question gets this duration by default unless individually configured.
          </Text>

          <View style={styles.timerInputRow}>
            <View style={styles.timeBox}>
              <TextInput
                value={questionSeconds}
                onChangeText={(text) => setQuestionSeconds(text.replace(/[^0-9]/g, '').slice(0, 3))}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="20"
                placeholderTextColor={theme.brandTextMuted}
                style={styles.timeInput}
              />
              <Text style={styles.timeUnitLabel}>SECONDS</Text>
            </View>
          </View>
        </Card>

        {/* Quick Presets */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>QUICK PRESETS</Text>
          <Text style={styles.sectionDesc}>
            Tap a preset to quickly set the default question time.
          </Text>

          <View style={styles.presetsGrid}>
            {PRESETS.map((p) => {
              const isSelected = selectedNum === p.seconds;

              return (
                <TouchableOpacity
                  key={p.label}
                  activeOpacity={0.7}
                  onPress={() => applyPreset(p.seconds)}
                  style={[
                    styles.presetPill,
                    isSelected && styles.presetPillSelected,
                  ]}
                >
                  <Ionicons
                    name="timer-outline"
                    size={18}
                    color={isSelected ? theme.brandBurgundy : theme.brandTextSecondary}
                  />
                  <Text
                    style={[
                      styles.presetText,
                      isSelected && styles.presetTextSelected,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Save CTA */}
        <Button
          title="SAVE QUESTION TIMER"
          onPress={handleSave}
          style={styles.saveBtn}
          icon={<Ionicons name="checkmark-circle" size={20} color={theme.white} />}
        />
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
  },
  headerInfo: {
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  timerInputRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  timeBox: {
    alignItems: 'center',
    width: 140,
  },
  timeInput: {
    width: '100%',
    height: 76,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1.5,
    borderColor: theme.brandBurgundyBorder,
    borderRadius: 16,
    fontSize: 34,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    textAlign: 'center',
  },
  timeUnitLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  presetPillSelected: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundy,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  presetTextSelected: {
    color: theme.brandBurgundy,
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 6,
  },
});
