import React, { useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { theme } from '../theme/colors';

interface PinInputProps {
  pin: string;
  onChangePin: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: boolean;
}

export const PinInput: React.FC<PinInputProps> = ({
  pin,
  onChangePin,
  onComplete,
  error = false,
}) => {
  const inputRef = useRef<any>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    // Only accept numeric digits, up to 6
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 6);
    onChangePin(sanitized);

    if (sanitized.length === 6 && onComplete) {
      onComplete(sanitized);
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Hidden real TextInput for native keyboard handling */}
      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus={true}
        style={styles.hiddenInput}
        caretHidden={true}
      />

      {/* 6 Custom Digit Boxes */}
      <View style={styles.boxesRow}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const digit = pin[index] || '';
          const isFocused = pin.length === index;
          const isFilled = digit !== '';

          return (
            <View
              key={index}
              style={[
                styles.digitBox,
                isFocused && styles.focusedBox,
                isFilled && styles.filledBox,
                error && styles.errorBox,
              ]}
            >
              <Text
                style={[
                  styles.digitText,
                  isFilled && styles.filledText,
                  error && styles.errorText,
                ]}
              >
                {digit}
              </Text>
              {isFocused && <View style={styles.cursor} />}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    width: '100%',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0.01,
    width: 1,
    height: 1,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    gap: 8,
  },
  digitBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 1.5,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  focusedBox: {
    borderColor: theme.brandBurgundy,
    backgroundColor: theme.brandBurgundyLight,
    transform: [{ scale: 1.04 }],
  },
  filledBox: {
    borderColor: theme.brandBurgundy,
    backgroundColor: theme.white,
  },
  errorBox: {
    borderColor: theme.danger,
    backgroundColor: theme.dangerSurface,
  },
  digitText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  filledText: {
    color: theme.brandBurgundy,
  },
  errorText: {
    color: theme.dangerText,
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.brandBurgundy,
  },
});
