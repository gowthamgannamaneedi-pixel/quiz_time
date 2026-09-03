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
import { realtimeSession } from '../../src/services/realtimeSession';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { theme } from '../../src/theme/colors';
import { QuizStatus } from '../../src/types/quiz.types';
import { isAdminAuthenticated } from '../../src/utils/adminAuth';

export default function QuizSettingsScreen() {
  const router = useRouter();
  const { quiz, updateQuizSettings, updateStatus } = useAdminQuiz();

  const [title, setTitle] = useState(quiz.title);
  const [category, setCategory] = useState(quiz.category);
  const [description, setDescription] = useState(quiz.description);
  const [pin, setPin] = useState(quiz.pin);
  const [status, setLocalStatus] = useState<QuizStatus>(quiz.status);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  // Sync form state when store changes
  useEffect(() => {
    setTitle(quiz.title);
    setCategory(quiz.category);
    setDescription(quiz.description);
    setPin(quiz.pin);
    setLocalStatus(quiz.status);
  }, [quiz.title, quiz.category, quiz.description, quiz.pin, quiz.status]);

  const resetDefaultPin = () => {
    setPin('123456');
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Quiz title cannot be empty.');
      return;
    }

    if (!pin.trim() || !/^\d{6}$/.test(pin.trim())) {
      Alert.alert('Validation Error', 'Quiz PIN must be exactly 6 numeric digits.');
      return;
    }

    const cleanPin = pin.trim();
    const cleanTitle = title.trim();
    const cleanCategory = (category || '').trim();
    const cleanDescription = (description || '').trim();

    updateQuizSettings({
      title: cleanTitle,
      category: cleanCategory,
      description: cleanDescription,
      pin: cleanPin,
    });

    updateStatus(status);

    // Broadcast authoritative PIN & Settings to Realtime Session Server
    realtimeSession.adminUpdateSettings({
      pin: cleanPin,
      title: cleanTitle,
      category: cleanCategory,
      description: cleanDescription,
    });

    Alert.alert('Settings Saved', 'Quiz configuration and PIN updated across all devices.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Quiz Settings" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BrandLogo size="sm" showText subtitle="College Quiz 2026" style={{ marginBottom: 14 }} />

        {/* Title & Category */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quiz Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. College Quiz 2026"
              placeholderTextColor={theme.brandTextMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category / Event Name</Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Annual Technical Fest"
              placeholderTextColor={theme.brandTextMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description / Guidelines</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Instructions displayed to participants..."
              placeholderTextColor={theme.brandTextMuted}
              multiline
              numberOfLines={3}
              style={[styles.textInput, styles.textArea]}
            />
          </View>
        </Card>

        {/* 6-Digit PIN Settings */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Access PIN Configuration</Text>
          <Text style={styles.sectionDesc}>
            Students will enter this 6-digit numeric PIN on their mobile devices.
          </Text>

          <View style={styles.pinRow}>
            <TextInput
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={theme.brandTextMuted}
              style={styles.pinInput}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={resetDefaultPin}
              style={styles.generateBtn}
            >
              <Ionicons name="refresh" size={18} color={theme.white} />
              <Text style={styles.generateBtnText}>RESET TO 123456</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quiz Lifecycle Status */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Event Lifecycle Status</Text>

          <View style={styles.statusGrid}>
            {(['DRAFT', 'READY', 'WAITING', 'LIVE', 'ENDED'] as QuizStatus[]).map((st) => {
              const isSelected = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  activeOpacity={0.7}
                  onPress={() => setLocalStatus(st)}
                  style={[
                    styles.statusPill,
                    isSelected && styles.statusPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isSelected && styles.statusPillTextSelected,
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Save CTA */}
        <Button
          title="SAVE SETTINGS"
          onPress={handleSave}
          style={styles.saveBtn}
          icon={<Ionicons name="save-outline" size={20} color={theme.white} />}
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
    paddingBottom: 36,
    gap: 16,
  },
  card: {
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandBurgundy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: theme.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    fontSize: 14,
    color: theme.brandText,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pinRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  pinInput: {
    flex: 1,
    backgroundColor: theme.brandBurgundyLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    letterSpacing: 4,
    textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: theme.brandBurgundy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.white,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  statusPill: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.white,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  statusPillSelected: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundy,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  statusPillTextSelected: {
    color: theme.brandBurgundy,
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 6,
  },
});
