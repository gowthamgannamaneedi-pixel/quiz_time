import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

interface QuestionNavigatorProps {
  visible: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, string | null>;
  markedForReview: Record<string, boolean>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  visible,
  onClose,
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  questionIds,
  onSelectQuestion,
}) => {
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Question Navigator</Text>
              <Text style={styles.subtitle}>Jump to any question instantly</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={theme.brandText} />
            </TouchableOpacity>
          </View>

          {/* Legend Summary Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotAnswered]} />
              <Text style={styles.legendText}>Answered ({answeredCount})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotReview]} />
              <Text style={styles.legendText}>Review ({reviewCount})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.dotUnanswered]} />
              <Text style={styles.legendText}>Unanswered ({unansweredCount})</Text>
            </View>
          </View>

          {/* Grid of Questions */}
          <ScrollView contentContainerStyle={styles.gridContainer}>
            {questionIds.map((qId, idx) => {
              const isCurrent = currentIndex === idx;
              const isAnswered = !!answers[qId];
              const isReview = !!markedForReview[qId];

              return (
                <TouchableOpacity
                  key={qId}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectQuestion(idx);
                    onClose();
                  }}
                  style={[
                    styles.gridBox,
                    isAnswered && styles.boxAnswered,
                    isReview && styles.boxReview,
                    isCurrent && styles.boxCurrent,
                  ]}
                >
                  <Text
                    style={[
                      styles.gridBoxText,
                      isAnswered && styles.textAnswered,
                      isReview && styles.textReview,
                      isCurrent && styles.textCurrent,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                  {isReview && <View style={styles.reviewBadge} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(21, 25, 35, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandText,
  },
  subtitle: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.brandSurfaceLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotAnswered: {
    backgroundColor: theme.success,
  },
  dotReview: {
    backgroundColor: theme.brandGold,
  },
  dotUnanswered: {
    backgroundColor: theme.brandBorder,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  gridBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  boxCurrent: {
    borderColor: theme.brandBurgundy,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 2,
  },
  boxAnswered: {
    backgroundColor: theme.successSurface,
    borderColor: theme.success,
  },
  boxReview: {
    borderColor: theme.brandGold,
  },
  gridBoxText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandTextSecondary,
  },
  textCurrent: {
    color: theme.brandBurgundy,
  },
  textAnswered: {
    color: theme.successText,
  },
  textReview: {
    color: theme.brandGoldText,
  },
  reviewBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.brandGold,
  },
});
