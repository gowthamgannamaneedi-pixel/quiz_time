import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { BrandLogo } from './BrandLogo';
import { theme } from '../theme/colors';
import { playCountdownTick, playCountdownGo } from '../utils/soundEffects';

interface CountdownOverlayProps {
  /**
   * Authoritative remaining seconds (3, 2, 1) computed from server clock
   */
  secondsRemaining: number;
  /**
   * Quiz title e.g. "College Quiz 2026"
   */
  quizTitle?: string;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  secondsRemaining,
  quizTitle = 'College Quiz 2026',
}) => {
  const currentTick = Math.min(3, Math.max(1, Math.ceil(secondsRemaining)));
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;
  const lastPlayedTickRef = useRef<number | null>(null);

  // Trigger animation and sound when tick changes
  useEffect(() => {
    if (lastPlayedTickRef.current !== currentTick) {
      lastPlayedTickRef.current = currentTick;
      playCountdownTick(currentTick);

      // Spring / pulse animation for the large countdown number
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0.2);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentTick]);

  return (
    <View style={styles.fullscreenContainer}>
      {/* Background Decorative Rings */}
      <View style={styles.backgroundAura} />

      {/* Prominent NIAT Brand Header */}
      <View style={styles.brandHeader}>
        <BrandLogo size="hero" showText={false} style={styles.brandLogo} />
        <Text style={styles.brandTitle}>NIAT ADVANCED TECH CLUB</Text>
        <Text style={styles.quizTitleHero}>{quizTitle}</Text>
      </View>

      {/* Center Countdown Pulse Section */}
      <View style={styles.countdownCenter}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>LIVE QUIZ STARTING IN</Text>
        </View>

        <Animated.View
          style={[
            styles.numberCircle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Text style={styles.countdownNumber}>{currentTick}</Text>
        </Animated.View>

        <Text style={styles.instructionsText}>
          Get ready! Question 1 starts in {currentTick} second{currentTick > 1 ? 's' : ''}...
        </Text>
      </View>

      {/* Footer Info */}
      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          Synchronized Live Examination • Full 20s per question
        </Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.brandBackground,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  backgroundAura: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: (width * 1.2) / 2,
    backgroundColor: theme.brandBurgundyLight,
    opacity: 0.5,
    top: '20%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    width: '100%',
  },
  brandLogo: {
    marginBottom: 12,
    shadowColor: theme.brandBurgundy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.brandBurgundy,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  quizTitleHero: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.brandText,
    textAlign: 'center',
  },
  countdownCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.brandGoldSurface,
    borderColor: theme.brandGoldBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.brandGold,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandGoldText,
    letterSpacing: 1,
  },
  numberCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.white,
    borderWidth: 4,
    borderColor: theme.brandBurgundy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.brandBurgundy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 76,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    lineHeight: 84,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  footerNote: {
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  footerNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandTextSecondary,
    textAlign: 'center',
  },
});
