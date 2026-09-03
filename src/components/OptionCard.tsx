import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

interface OptionCardProps {
  optionKey: 'A' | 'B' | 'C' | 'D';
  text: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  isLocked?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  optionKey,
  text,
  isSelected,
  onSelect,
  disabled = false,
  isLocked = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.75}
      onPress={disabled ? undefined : onSelect}
      disabled={disabled}
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        isSelected && isLocked && styles.lockedSelectedContainer,
        disabled && !isSelected && styles.disabledContainer,
      ]}
    >
      <View
        style={[
          styles.letterBadge,
          isSelected && styles.selectedLetterBadge,
          isSelected && isLocked && styles.lockedSelectedLetterBadge,
        ]}
      >
        <Text
          style={[
            styles.letterText,
            isSelected && styles.selectedLetterText,
          ]}
        >
          {optionKey}
        </Text>
      </View>

      <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
        {text}
      </Text>

      <View
        style={[
          styles.radioCircle,
          isSelected && styles.selectedRadioCircle,
          isSelected && isLocked && styles.lockedRadioCircle,
        ]}
      >
        {isSelected && (
          <Ionicons
            name={isLocked ? "lock-closed" : "checkmark-circle"}
            size={isLocked ? 14 : 18}
            color={theme.white}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    marginVertical: 5,
    gap: 12,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 56,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'manipulation',
        }
      : {}),
  } as any,
  selectedContainer: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundy,
    borderWidth: 1.5,
  },
  lockedSelectedContainer: {
    backgroundColor: theme.successSurface,
    borderColor: theme.success,
  },
  disabledContainer: {
    opacity: 0.55,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  selectedLetterBadge: {
    backgroundColor: theme.brandBurgundy,
    borderColor: theme.brandBurgundy,
  },
  lockedSelectedLetterBadge: {
    backgroundColor: theme.success,
    borderColor: theme.successBorder,
  },
  letterText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandText,
  },
  selectedLetterText: {
    color: theme.white,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.brandText,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: theme.brandBurgundy,
    fontWeight: '800',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioCircle: {
    borderWidth: 0,
    backgroundColor: theme.brandBurgundy,
  },
  lockedRadioCircle: {
    borderWidth: 0,
    backgroundColor: theme.success,
  },
});
