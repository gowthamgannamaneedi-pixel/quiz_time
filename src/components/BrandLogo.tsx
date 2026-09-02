import React from 'react';
import { View, Image, StyleSheet, Text, ImageStyle, ViewStyle } from 'react-native';
import { theme } from '../theme/colors';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  subtitle?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  subtitle = 'College Quiz 2026',
  style,
  imageStyle,
}) => {
  const getImageDimensions = () => {
    switch (size) {
      case 'sm':
        return { width: 34, height: 34, borderRadius: 17 };
      case 'md':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'lg':
        return { width: 84, height: 84, borderRadius: 42 };
      case 'hero':
        return { width: 110, height: 110, borderRadius: 55 };
      default:
        return { width: 60, height: 60, borderRadius: 30 };
    }
  };

  const dims = getImageDimensions();

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/logo.png')}
        style={[
          styles.logoImage,
          { width: dims.width, height: dims.height, borderRadius: dims.borderRadius },
          imageStyle,
        ]}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textContainer}>
          <Text style={styles.brandTitle}>NIAT ADVANCE TECH CLUB</Text>
          {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    alignSelf: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.brandText,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
