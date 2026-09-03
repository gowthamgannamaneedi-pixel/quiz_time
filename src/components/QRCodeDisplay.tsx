import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../theme/colors';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

const QRCodeDisplayComponent: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 220,
}) => {
  const containerDimension = size + 32;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.qrContainer,
          {
            width: containerDimension,
            height: containerDimension,
            minWidth: containerDimension,
            minHeight: containerDimension,
            maxWidth: containerDimension,
            maxHeight: containerDimension,
          },
        ]}
      >
        <QRCode
          value={value}
          size={size}
          color="#151923"
          backgroundColor="#ffffff"
          quietZone={8}
        />
      </View>
    </View>
  );
};

export const QRCodeDisplay = React.memo(
  QRCodeDisplayComponent,
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value && prevProps.size === nextProps.size
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? {
          userSelect: 'none',
          contain: 'strict',
          willChange: 'transform',
        }
      : {}),
  } as any,
});
