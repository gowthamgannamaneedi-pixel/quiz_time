import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Platform,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { useRealtimeSession } from '../../src/hooks/useRealtimeSession';
import { realtimeSession } from '../../src/services/realtimeSession';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { BrandLogo } from '../../src/components/BrandLogo';
import { QRCodeDisplay } from '../../src/components/QRCodeDisplay';
import { theme } from '../../src/theme/colors';
import { buildQuizJoinURL, getDetectedLanHost } from '../../src/utils/deepLink';
import { isAdminAuthenticated } from '../../src/utils/adminAuth';

export default function AdminQRScreen() {
  const router = useRouter();
  const { quiz } = useAdminQuiz();
  const { pin: sessionPin, session } = useRealtimeSession();
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isRefreshingIp, setIsRefreshingIp] = useState(false);
  const [customIp, setCustomIp] = useState<string>('');
  const [isEditingIp, setIsEditingIp] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  // Authoritative PIN
  const activePin = sessionPin || quiz.pin;

  // Dynamically resolve current computer LAN IPv4
  const detectedLanIp = session.lanIp || realtimeSession.getServerLanIp() || getDetectedLanHost().ip;
  const activeIp = (customIp && customIp.trim()) ? customIp.trim() : detectedLanIp;

  // Universal Join Link encoded in QR
  const joinUrl = buildQuizJoinURL(quiz.id, activePin, undefined, activeIp);

  // Auto-fetch fresh LAN IP on mount
  useEffect(() => {
    handleRefreshLanIp();
  }, []);

  const handleRefreshLanIp = async () => {
    setIsRefreshingIp(true);
    try {
      const freshIp = await realtimeSession.fetchLanInfoDirectly();
      if (freshIp) {
        setCustomIp('');
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshingIp(false), 500);
    }
  };

  const handleShareLink = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !(navigator as any).share) {
        Alert.alert('Quiz Event Details', `Quiz: ${quiz.title}\nJoin Link: ${joinUrl}\nPIN: ${activePin}`);
        return;
      }

      await Share.share({
        message: `Join official quiz "${quiz.title}":\n${joinUrl}\nPIN Code: ${activePin}`,
        title: quiz.title,
        url: joinUrl,
      });
    } catch (err: any) {
      Alert.alert('Share Link', `Join Link: ${joinUrl}\nPIN: ${activePin}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
      }
    } catch {
      // ignore
    }
    setCopiedNotice(true);
    Alert.alert('Link Copied', `Universal Join Link copied to clipboard:\n${joinUrl}`);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Official Universal Quiz QR" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Network & Dynamic LAN IP Status Bar */}
        <View style={styles.networkStatusCard}>
          <View style={styles.networkStatusLeft}>
            <View style={styles.wifiIndicator}>
              <Ionicons name="wifi" size={16} color={theme.success} />
            </View>
            <View>
              <Text style={styles.networkStatusTitle}>Active LAN IPv4 Address</Text>
              <Text style={styles.networkStatusIp}>{activeIp}:8081</Text>
            </View>
          </View>

          <View style={styles.networkStatusActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleRefreshLanIp}
              style={styles.refreshIconButton}
              disabled={isRefreshingIp}
            >
              {isRefreshingIp ? (
                <ActivityIndicator size="small" color={theme.brandBurgundy} />
              ) : (
                <Ionicons name="refresh" size={16} color={theme.brandBurgundy} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsEditingIp(!isEditingIp)}
              style={styles.editIconButton}
            >
              <Ionicons name={isEditingIp ? 'close' : 'create-outline'} size={16} color={theme.brandTextSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Manual IP Override */}
        {isEditingIp && (
          <View style={styles.manualIpBox}>
            <Text style={styles.manualIpLabel}>Custom LAN IPv4 Override:</Text>
            <View style={styles.manualIpInputRow}>
              <TextInput
                style={styles.manualIpInput}
                value={customIp}
                placeholder={detectedLanIp}
                placeholderTextColor={theme.brandTextMuted}
                onChangeText={setCustomIp}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {customIp ? (
                <TouchableOpacity
                  onPress={() => setCustomIp('')}
                  style={styles.resetIpBtn}
                >
                  <Text style={styles.resetIpBtnText}>Reset</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Main QR Card */}
        <Card style={styles.qrCard}>
          <BrandLogo size="md" showText subtitle="College Quiz 2026" style={{ marginBottom: 12 }} />

          <View style={styles.badgeRow}>
            <View style={styles.pinBadge}>
              <Text style={styles.pinBadgeLabel}>PIN:</Text>
              <Text style={styles.pinBadgeValue}>{activePin}</Text>
            </View>
          </View>

          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.quizDesc}>
            Project this QR code on screen. Students scan with normal phone camera or Google Lens to join immediately.
          </Text>

          {/* High Contrast QR Code encoding Universal Join Link */}
          <View style={styles.qrWrapper}>
            <QRCodeDisplay value={joinUrl} size={220} />
          </View>

          {/* Prominent Generated URL Displayed Underneath QR */}
          <View style={styles.qrUrlBox}>
            <Text style={styles.qrUrlLabel}>SCAN TO JOIN</Text>
            <Text style={styles.qrUrlText} selectable>{joinUrl}</Text>
          </View>

          <View style={styles.scanNotice}>
            <Ionicons name="camera" size={16} color={theme.success} />
            <Text style={styles.scanNoticeText}>
              Universal Link: Scannable by normal phone camera / Lens
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="SHARE LINK"
            onPress={handleShareLink}
            style={{ flex: 1 }}
            icon={<Ionicons name="share-social-outline" size={18} color={theme.white} />}
          />

          <Button
            title={copiedNotice ? "LINK COPIED ✓" : "COPY LINK"}
            variant="secondary"
            onPress={handleCopyLink}
            style={{ flex: 1 }}
            icon={<Ionicons name="copy-outline" size={18} color={theme.brandTextSecondary} />}
          />
        </View>
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
    alignItems: 'center',
    gap: 16,
    paddingBottom: 36,
  },
  networkStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  networkStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wifiIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.successSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.successBorder,
  },
  networkStatusTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  networkStatusIp: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  networkStatusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  manualIpBox: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    width: '100%',
    maxWidth: 420,
  },
  manualIpLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    marginBottom: 6,
  },
  manualIpInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualIpInput: {
    flex: 1,
    height: 38,
    backgroundColor: theme.brandSurfaceLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  resetIpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  resetIpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  qrCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
  },
  badgeRow: {
    marginBottom: 6,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pinBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  pinBadgeValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    letterSpacing: 2,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.brandText,
    textAlign: 'center',
    marginTop: 6,
  },
  quizDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 18,
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: theme.brandSurfaceLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrUrlBox: {
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  qrUrlLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.brandBurgundy,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  qrUrlText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.brandText,
    textAlign: 'center',
    lineHeight: 16,
  },
  scanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 2,
  },
  scanNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.brandTextSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 420,
  },
});
