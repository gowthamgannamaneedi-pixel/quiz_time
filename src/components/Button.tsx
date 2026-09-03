import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { theme } from '../theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'scanner' | 'danger';
  size?: 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'scanner':
        return styles.scannerContainer;
      case 'danger':
        return styles.dangerContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'secondary':
        return styles.secondaryText;
      case 'danger':
        return styles.dangerText;
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        size === 'lg' ? styles.sizeLg : styles.sizeMd,
        getContainerStyle(),
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.brandPrimary : theme.white} />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 44,
    ...(Platform.OS === 'web'
      ? {
          cursor: 'pointer',
          userSelect: 'none',
          touchAction: 'manipulation',
        }
      : {}),
  } as any,
  sizeLg: {
    height: 52,
    paddingHorizontal: 20,
  },
  sizeMd: {
    height: 44,
    paddingHorizontal: 16,
  },
  primaryContainer: {
    backgroundColor: theme.brandPrimary,
    shadowColor: theme.brandPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryContainer: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.brandPrimary,
  },
  scannerContainer: {
    backgroundColor: theme.brandAccent,
    shadowColor: theme.brandAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerContainer: {
    backgroundColor: theme.danger,
    shadowColor: theme.danger,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledContainer: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 8,
  },
  baseText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: theme.white,
  },
  secondaryText: {
    color: theme.brandText,
  },
  outlineText: {
    color: theme.brandPrimary,
  },
  dangerText: {
    color: theme.white,
  },
});
