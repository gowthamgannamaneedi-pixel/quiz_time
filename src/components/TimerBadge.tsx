import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

interface TimerBadgeProps {
  secondsRemaining: number;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({ secondsRemaining }) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsRemaining <= 5; // Under 5 secs
  const isWarning = secondsRemaining <= 10 && !isUrgent; // Under 10 secs

  return (
    <View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        isUrgent && styles.urgentContainer,
      ]}
    >
      <Ionicons
        name="time-outline"
        size={16}
        color={isUrgent ? theme.brandAccent : isWarning ? theme.warning : theme.brandBurgundy}
      />
      <Text
        style={[
          styles.timerText,
          isWarning && styles.warningText,
          isUrgent && styles.urgentText,
        ]}
      >
        {formattedTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  warningContainer: {
    backgroundColor: theme.warningSurface,
    borderColor: theme.warningBorder,
  },
  urgentContainer: {
    backgroundColor: theme.dangerSurface,
    borderColor: theme.brandAccent,
    borderWidth: 1.5,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
  },
  warningText: {
    color: theme.warningText,
  },
  urgentText: {
    color: theme.brandAccent,
  },
});
