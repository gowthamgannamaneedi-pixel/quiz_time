import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
import { Question } from '../../src/types/quiz.types';
import { isAdminAuthenticated } from '../../src/utils/adminAuth';

export default function QuestionsManagementScreen() {
  const router = useRouter();
  const {
    quiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
  } = useAdminQuiz();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Editor form state
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [marks, setMarks] = useState('2');
  const [timeLimit, setTimeLimit] = useState('20');

  const handleOpenAdd = () => {
    setEditingQuestionId(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
    setMarks('2');
    setTimeLimit('20');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setQText(q.question);
    setOptA(q.options.find((o) => o.key === 'A')?.text || '');
    setOptB(q.options.find((o) => o.key === 'B')?.text || '');
    setOptC(q.options.find((o) => o.key === 'C')?.text || '');
    setOptD(q.options.find((o) => o.key === 'D')?.text || '');
    setCorrectAnswer(q.correctAnswer);
    setMarks((q.marks || 2).toString());
    setTimeLimit((q.timeLimit || 20).toString());
    setIsEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Question?', 'Are you sure you want to delete this question?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteQuestion(id),
      },
    ]);
  };

  const handleSaveQuestion = () => {
    if (!qText.trim()) {
      Alert.alert('Validation Error', 'Question text is required.');
      return;
    }

    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      Alert.alert('Validation Error', 'All four options (A, B, C, D) must be filled.');
      return;
    }

    const rawM = parseFloat(marks);
    const rawTL = parseInt(timeLimit, 10);
    const parsedMarks = isNaN(rawM) ? 2 : Math.max(0, rawM);
    const parsedTimeLimit = isNaN(rawTL) || rawTL < 5 ? 20 : rawTL;

    const questionPayload: Omit<Question, 'id'> = {
      question: qText.trim(),
      options: [
        { key: 'A', text: optA.trim() },
        { key: 'B', text: optB.trim() },
        { key: 'C', text: optC.trim() },
        { key: 'D', text: optD.trim() },
      ],
      correctAnswer,
      marks: parsedMarks,
      negativeMarks: 0,
      timeLimit: parsedTimeLimit,
    };

    if (editingQuestionId) {
      updateQuestion(editingQuestionId, questionPayload);
    } else {
      addQuestion(questionPayload);
    }

    setIsEditorOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Question Management" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.brandBanner}>
          <BrandLogo size="sm" showText subtitle="College Quiz 2026" />
        </View>

        {/* Header Bar with Count & Add CTA */}
        <View style={styles.topActionsRow}>
          <View>
            <Text style={styles.totalQuestionsText}>
              QUESTIONS ({quiz.questions.length})
            </Text>
            <Text style={styles.totalMarksText}>
              Total Marks: {quiz.questions.reduce((acc, q) => acc + (q.marks || 2), 0)} pts • No Negative Marking
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenAdd}
            style={styles.addBtn}
          >
            <Ionicons name="add-circle" size={20} color={theme.white} />
            <Text style={styles.addBtnText}>ADD QUESTION</Text>
          </TouchableOpacity>
        </View>

        {/* Questions List */}
        {quiz.questions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="help-circle-outline" size={48} color={theme.brandTextSecondary} />
            <Text style={styles.emptyTitle}>No Questions Configured</Text>
            <Text style={styles.emptyDesc}>
              Tap &quot;ADD QUESTION&quot; above to create your first quiz question.
            </Text>
          </Card>
        ) : (
          quiz.questions.map((q, idx) => (
            <Card key={q.id} style={styles.questionCard}>
              {/* Question Card Top Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.qIndexBadge}>
                  <Text style={styles.qIndexText}>Q{idx + 1}</Text>
                </View>

                <View style={styles.badgeGroup}>
                  <View style={styles.correctPill}>
                    <Text style={styles.correctPillText}>
                      Ans: {q.correctAnswer}
                    </Text>
                  </View>

                  <View style={styles.timeLimitPill}>
                    <Ionicons name="timer-outline" size={13} color={theme.brandBurgundy} />
                    <Text style={styles.timeLimitPillText}>
                      {q.timeLimit || 20}s
                    </Text>
                  </View>

                  <View style={styles.marksPill}>
                    <Text style={styles.marksPillText}>
                      +{q.marks || 2} marks
                    </Text>
                  </View>

                  {/* Reorder Arrows */}
                  <View style={styles.reorderGroup}>
                    <TouchableOpacity
                      disabled={idx === 0}
                      onPress={() => reorderQuestions(idx, idx - 1)}
                      style={[styles.arrowBtn, idx === 0 && styles.arrowBtnDisabled]}
                    >
                      <Ionicons name="chevron-up" size={16} color={idx === 0 ? theme.brandBorder : theme.brandText} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={idx === quiz.questions.length - 1}
                      onPress={() => reorderQuestions(idx, idx + 1)}
                      style={[
                        styles.arrowBtn,
                        idx === quiz.questions.length - 1 && styles.arrowBtnDisabled,
                      ]}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={idx === quiz.questions.length - 1 ? theme.brandBorder : theme.brandText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Question Statement */}
              <Text style={styles.questionText}>{q.question}</Text>

              {/* Options Grid */}
              <View style={styles.optionsPreviewGrid}>
                {q.options.map((opt) => {
                  const isCorrect = opt.key === q.correctAnswer;
                  return (
                    <View
                      key={opt.key}
                      style={[
                        styles.optionPill,
                        isCorrect && styles.optionPillCorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionKey,
                          isCorrect && styles.optionKeyCorrect,
                        ]}
                      >
                        {opt.key}:
                      </Text>
                      <Text
                        style={[
                          styles.optionText,
                          isCorrect && styles.optionTextCorrect,
                        ]}
                        numberOfLines={1}
                      >
                        {opt.text}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Action Buttons: Edit, Duplicate, Delete */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenEdit(q)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="pencil" size={16} color={theme.brandBurgundy} />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => duplicateQuestion(q.id)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="copy-outline" size={16} color={theme.brandTextSecondary} />
                  <Text style={styles.actionBtnText}>Duplicate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDelete(q.id)}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.danger} />
                  <Text style={[styles.actionBtnText, { color: theme.danger }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Question Editor Modal */}
      <Modal
        visible={isEditorOpen}
        animationType="slide"
        onRequestClose={() => setIsEditorOpen(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <Header
            showBack
            title={editingQuestionId ? 'Edit Question' : 'New Question'}
            onBackPress={() => setIsEditorOpen(false)}
          />

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Question Text */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Question Statement</Text>
              <TextInput
                value={qText}
                onChangeText={setQText}
                placeholder="Enter question text..."
                placeholderTextColor={theme.brandTextMuted}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />
            </Card>

            {/* MCQ Options A, B, C, D */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Options & Correct Answer</Text>
              <Text style={styles.sectionSubtitle}>
                Enter all 4 options and select the radio button for the correct answer.
              </Text>

              {/* Option A */}
              <View style={styles.optionInputRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCorrectAnswer('A')}
                  style={[
                    styles.radioBtn,
                    correctAnswer === 'A' && styles.radioBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioBtnText,
                      correctAnswer === 'A' && styles.radioBtnTextSelected,
                    ]}
                  >
                    A
                  </Text>
                </TouchableOpacity>
                <TextInput
                  value={optA}
                  onChangeText={setOptA}
                  placeholder="Option A text..."
                  placeholderTextColor={theme.brandTextMuted}
                  style={[
                    styles.optionTextInput,
                    correctAnswer === 'A' && styles.optionTextInputCorrect,
                  ]}
                />
              </View>

              {/* Option B */}
              <View style={styles.optionInputRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCorrectAnswer('B')}
                  style={[
                    styles.radioBtn,
                    correctAnswer === 'B' && styles.radioBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioBtnText,
                      correctAnswer === 'B' && styles.radioBtnTextSelected,
                    ]}
                  >
                    B
                  </Text>
                </TouchableOpacity>
                <TextInput
                  value={optB}
                  onChangeText={setOptB}
                  placeholder="Option B text..."
                  placeholderTextColor={theme.brandTextMuted}
                  style={[
                    styles.optionTextInput,
                    correctAnswer === 'B' && styles.optionTextInputCorrect,
                  ]}
                />
              </View>

              {/* Option C */}
              <View style={styles.optionInputRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCorrectAnswer('C')}
                  style={[
                    styles.radioBtn,
                    correctAnswer === 'C' && styles.radioBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioBtnText,
                      correctAnswer === 'C' && styles.radioBtnTextSelected,
                    ]}
                  >
                    C
                  </Text>
                </TouchableOpacity>
                <TextInput
                  value={optC}
                  onChangeText={setOptC}
                  placeholder="Option C text..."
                  placeholderTextColor={theme.brandTextMuted}
                  style={[
                    styles.optionTextInput,
                    correctAnswer === 'C' && styles.optionTextInputCorrect,
                  ]}
                />
              </View>

              {/* Option D */}
              <View style={styles.optionInputRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setCorrectAnswer('D')}
                  style={[
                    styles.radioBtn,
                    correctAnswer === 'D' && styles.radioBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioBtnText,
                      correctAnswer === 'D' && styles.radioBtnTextSelected,
                    ]}
                  >
                    D
                  </Text>
                </TouchableOpacity>
                <TextInput
                  value={optD}
                  onChangeText={setOptD}
                  placeholder="Option D text..."
                  placeholderTextColor={theme.brandTextMuted}
                  style={[
                    styles.optionTextInput,
                    correctAnswer === 'D' && styles.optionTextInputCorrect,
                  ]}
                />
              </View>
            </Card>

            {/* Marks & Time Limit */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Scoring & Time Limit</Text>

              <View style={styles.marksInputsRow}>
                <View style={styles.marksField}>
                  <Text style={styles.label}>Marks (+)</Text>
                  <TextInput
                    value={marks}
                    onChangeText={setMarks}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor={theme.brandTextMuted}
                    style={styles.marksInput}
                  />
                </View>

                <View style={styles.marksField}>
                  <Text style={styles.label}>Time Limit (s)</Text>
                  <TextInput
                    value={timeLimit}
                    onChangeText={(t) => setTimeLimit(t.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor={theme.brandTextMuted}
                    style={styles.marksInput}
                  />
                </View>
              </View>
            </Card>

            {/* Modal Save / Cancel buttons */}
            <View style={styles.modalButtonsRow}>
              <Button
                title="CANCEL"
                variant="secondary"
                onPress={() => setIsEditorOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="SAVE QUESTION"
                onPress={handleSaveQuestion}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  brandBanner: {
    alignItems: 'center',
    marginBottom: 4,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalQuestionsText: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.5,
  },
  totalMarksText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandBurgundy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: theme.brandBurgundy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.white,
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.brandText,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  questionCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  qIndexBadge: {
    backgroundColor: theme.brandBurgundyLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  qIndexText: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.brandBurgundy,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  correctPill: {
    backgroundColor: theme.successSurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.successBorder,
  },
  correctPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.successText,
  },
  timeLimitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.brandBurgundyLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  timeLimitPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  marksPill: {
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  marksPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  reorderGroup: {
    flexDirection: 'row',
    gap: 2,
    marginLeft: 4,
  },
  arrowBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
    lineHeight: 20,
    marginBottom: 12,
  },
  optionsPreviewGrid: {
    gap: 6,
    marginBottom: 14,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  optionPillCorrect: {
    backgroundColor: theme.successSurface,
    borderColor: theme.successBorder,
  },
  optionKey: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandTextSecondary,
  },
  optionKeyCorrect: {
    color: theme.successText,
  },
  optionText: {
    fontSize: 12,
    color: theme.brandText,
    flex: 1,
  },
  optionTextCorrect: {
    color: theme.successText,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.brandBorderLight,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  deleteBtn: {
    marginLeft: 'auto',
    backgroundColor: theme.dangerSurface,
    borderColor: theme.dangerBorder,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandText,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.brandBackground,
  },
  modalScroll: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
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
  sectionSubtitle: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginBottom: 12,
    lineHeight: 16,
  },
  textArea: {
    minHeight: 70,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: theme.brandText,
    textAlignVertical: 'top',
  },
  optionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  radioBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBtnSelected: {
    backgroundColor: theme.brandBurgundy,
    borderColor: theme.brandBurgundy,
  },
  radioBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.brandTextSecondary,
  },
  radioBtnTextSelected: {
    color: theme.white,
  },
  optionTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.brandText,
  },
  optionTextInputCorrect: {
    backgroundColor: theme.successSurface,
    borderColor: theme.successBorder,
  },
  marksInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  marksField: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    marginBottom: 4,
  },
  marksInput: {
    height: 44,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
