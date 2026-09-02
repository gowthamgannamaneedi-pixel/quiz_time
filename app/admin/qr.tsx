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
import {
  buildQuizJoinURL,
  getDetectedLanHost,
  getBaseOrigin,
  isProductionEnvironment,
  PRODUCTION_DOMAIN,
} from '../../src/utils/deepLink';
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

  const isProd = isProductionEnvironment();
  const activePin = sessionPin || quiz.pin;

  // Dynamically resolve current computer LAN IPv4 for dev mode
  const detectedLanIp = session.lanIp || realtimeSession.getServerLanIp() || getDetectedLanHost().ip;
  const activeIp = (customIp && customIp.trim()) ? customIp.trim() : detectedLanIp;

  // Universal Join Link encoded in QR:
  // In production -> https://quiz-time-chi.vercel.app/join/quiz-college-2026?pin=123456
  // In local dev  -> http://10.x.x.x:8081/join/quiz-college-2026?pin=123456
  const joinUrl = buildQuizJoinURL(
    quiz.id,
    activePin,
    isProd ? getBaseOrigin() : undefined,
    isProd ? undefined : activeIp
  );

  // Auto-fetch fresh LAN IP on mount in dev
  useEffect(() => {
    if (!isProd) {
      handleRefreshLanIp();
    }
  }, [isProd]);

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
        {/* Network & Origin Status Bar */}
        <View style={styles.networkStatusCard}>
          <View style={styles.networkStatusLeft}>
            <View style={[styles.wifiIndicator, isProd && styles.prodIndicator]}>
              <Ionicons name={isProd ? "cloud-done" : "wifi"} size={16} color={isProd ? theme.brandBurgundy : theme.success} />
            </View>
            <View>
              <Text style={styles.networkStatusTitle}>
                {isProd ? 'Production Cloud Origin' : 'Active LAN IPv4 Address'}
              </Text>
              <Text style={styles.networkStatusIp}>
                {isProd ? PRODUCTION_DOMAIN : `${activeIp}:8081`}
              </Text>
            </View>
          </View>

          {!isProd && (
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
          )}
        </View>

        {/* Optional Manual IP Override in local dev */}
        {!isProd && isEditingIp && (
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
              Universal Link: Scannable by phone camera or Student Scanner
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
    flex: 1,
  },
  wifiIndicator: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.successSurface,
    borderWidth: 1,
    borderColor: theme.successBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodIndicator: {
    backgroundColor: theme.brandBurgundyLight,
    borderColor: theme.brandBurgundyBorder,
  },
  networkStatusTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  networkStatusIp: {
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.brandSurfaceLight,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualIpBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.brandBorder,
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
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: 'monospace',
    color: theme.brandText,
  },
  resetIpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.brandBurgundyLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBurgundyBorder,
  },
  resetIpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandBurgundy,
  },
  qrCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: theme.white,
    borderColor: theme.brandBorder,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeRow: {
    marginBottom: 10,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1.5,
    borderColor: theme.brandBurgundyBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pinBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 1,
  },
  pinBadgeValue: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    letterSpacing: 2,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.brandText,
    textAlign: 'center',
    marginBottom: 6,
  },
  quizDesc: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 320,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: theme.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: theme.brandBurgundy,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  qrUrlBox: {
    width: '100%',
    backgroundColor: theme.brandSurfaceLight,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrUrlLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  qrUrlText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: theme.brandBurgundy,
    textAlign: 'center',
  },
  scanNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
