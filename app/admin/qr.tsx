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

  // QR Mode: 'PRODUCTION' (Cloud public event) or 'LOCAL_LAN' (local hotspot testing)
  const isProd = isProductionEnvironment();
  const [qrMode, setQrMode] = useState<'PRODUCTION' | 'LOCAL_LAN'>(isProd ? 'PRODUCTION' : 'LOCAL_LAN');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.replace('/admin');
    }
  }, []);

  const activePin = sessionPin || quiz.pin;

  // Dynamically resolve current computer LAN IPv4
  const detectedLanIp = session.lanIp || realtimeSession.getServerLanIp() || getDetectedLanHost().ip;
  const activeIp = (customIp && customIp.trim()) ? customIp.trim() : detectedLanIp;

  // Universal Join Link encoded in QR:
  // PRODUCTION: https://quiz-time-chi.vercel.app/join/quiz-college-2026?pin=123456
  // LOCAL_LAN:  http://10.x.x.x:8081/join/quiz-college-2026?pin=123456
  const joinUrl = buildQuizJoinURL(
    quiz.id,
    activePin,
    qrMode,
    qrMode === 'LOCAL_LAN' ? activeIp : undefined
  );

  // Auto-fetch fresh LAN IP on mount
  useEffect(() => {
    if (qrMode === 'LOCAL_LAN') {
      handleRefreshLanIp();
    }
  }, [qrMode]);

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
    Alert.alert('Link Copied', `Join Link copied to clipboard:\n${joinUrl}`);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header showBack title="Official Universal Quiz QR" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* QR Mode Selector Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[styles.modeTab, qrMode === 'PRODUCTION' && styles.modeTabActive]}
            onPress={() => setQrMode('PRODUCTION')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="globe-outline"
              size={18}
              color={qrMode === 'PRODUCTION' ? theme.white : theme.brandTextSecondary}
            />
            <Text style={[styles.modeTabText, qrMode === 'PRODUCTION' && styles.modeTabTextActive]}>
              Public Production Cloud
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, qrMode === 'LOCAL_LAN' && styles.modeTabActive]}
            onPress={() => setQrMode('LOCAL_LAN')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="wifi-outline"
              size={18}
              color={qrMode === 'LOCAL_LAN' ? theme.white : theme.brandTextSecondary}
            />
            <Text style={[styles.modeTabText, qrMode === 'LOCAL_LAN' && styles.modeTabTextActive]}>
              Local Wi-Fi / Hotspot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Network & Origin Status Bar */}
        <View style={styles.networkStatusCard}>
          <View style={styles.networkStatusLeft}>
            <View style={[styles.wifiIndicator, qrMode === 'PRODUCTION' && styles.prodIndicator]}>
              <Ionicons
                name={qrMode === 'PRODUCTION' ? "cloud-done" : "wifi"}
                size={16}
                color={qrMode === 'PRODUCTION' ? theme.brandBurgundy : theme.success}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.networkStatusTitle}>
                {qrMode === 'PRODUCTION' ? 'Public Production Cloud Origin' : 'Active Local LAN IPv4'}
              </Text>
              <Text style={styles.networkStatusIp}>
                {qrMode === 'PRODUCTION' ? PRODUCTION_DOMAIN : `${activeIp}:8081`}
              </Text>
              <Text style={styles.networkStatusSub}>
                {qrMode === 'PRODUCTION'
                  ? 'Zero Login Required • Direct Student Access'
                  : 'For devices on the same Wi-Fi / Hotspot'}
              </Text>
            </View>
          </View>

          {qrMode === 'LOCAL_LAN' && (
            <View style={styles.networkStatusActions}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={handleRefreshLanIp}
                disabled={isRefreshingIp}
              >
                {isRefreshingIp ? (
                  <ActivityIndicator size="small" color={theme.brandBurgundy} />
                ) : (
                  <Ionicons name="refresh" size={16} color={theme.brandBurgundy} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => setIsEditingIp(!isEditingIp)}
              >
                <Ionicons name={isEditingIp ? "close" : "create-outline"} size={16} color={theme.brandBurgundy} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Manual LAN IP Editor in Dev Mode */}
        {qrMode === 'LOCAL_LAN' && isEditingIp && (
          <View style={styles.ipEditCard}>
            <Text style={styles.ipEditLabel}>Custom LAN IPv4 Address:</Text>
            <View style={styles.ipInputRow}>
              <TextInput
                style={styles.ipInput}
                value={customIp}
                placeholder={detectedLanIp || '10.x.x.x'}
                placeholderTextColor={theme.brandTextMuted}
                onChangeText={setCustomIp}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity
                style={styles.ipSaveBtn}
                onPress={() => {
                  setIsEditingIp(false);
                  Alert.alert('LAN IP Updated', `QR code updated with IP: ${activeIp}`);
                }}
              >
                <Text style={styles.ipSaveBtnText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Main High-Resolution QR Card */}
        <Card style={styles.qrCard}>
          {/* Official Brand Logo */}
          <View style={styles.brandContainer}>
            <BrandLogo size="md" showText subtitle="Official Examination Center" />
          </View>

          <Text style={styles.quizTitle}>{quiz.title}</Text>

          {/* Environment Status Badge */}
          <View style={styles.envBadgeRow}>
            <View style={[styles.envBadge, qrMode === 'PRODUCTION' ? styles.envBadgeProd : styles.envBadgeDev]}>
              <Ionicons
                name={qrMode === 'PRODUCTION' ? "checkmark-circle" : "hardware-chip-outline"}
                size={14}
                color={qrMode === 'PRODUCTION' ? theme.brandGold : theme.brandBurgundy}
              />
              <Text style={[styles.envBadgeText, qrMode === 'PRODUCTION' ? styles.envBadgeTextProd : styles.envBadgeTextDev]}>
                {qrMode === 'PRODUCTION' ? 'PUBLIC PRODUCTION (NO LOGIN REQUIRED)' : 'LOCAL WI-FI / HOTSPOT'}
              </Text>
            </View>
          </View>

          {/* SCAN TO JOIN Prominent Section */}
          <View style={styles.scanToJoinHeaderBox}>
            <Text style={styles.scanToJoinHeading}>SCAN TO JOIN</Text>
            <Text style={styles.scanToJoinUrlText} numberOfLines={2} selectable>
              {joinUrl}
            </Text>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrWrapper}>
            <QRCodeDisplay
              value={joinUrl}
              size={240}
            />
          </View>

          <Text style={styles.scanInstruction}>
            Scan with any phone camera or student scanner to enter examination
          </Text>

          {/* Active 6-Digit PIN Display */}
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>SESSION ACCESS PIN</Text>
            <View style={styles.pinBox}>
              <Text style={styles.pinText}>{activePin}</Text>
            </View>
          </View>
        </Card>

        {/* Action Controls */}
        <View style={styles.buttonContainer}>
          <Button
            title={copiedNotice ? "COPIED TO CLIPBOARD!" : "COPY JOIN LINK"}
            onPress={handleCopyLink}
            variant={copiedNotice ? "primary" : "secondary"}
            style={styles.actionBtn}
          />

          <Button
            title="SHARE EVENT DETAILS"
            onPress={handleShareLink}
            variant="primary"
            style={styles.actionBtn}
          />
        </View>

        {/* Back to Control Center */}
        <Button
          title="RETURN TO ADMIN DASHBOARD"
          onPress={() => router.push('/admin')}
          variant="outline"
          style={styles.returnBtn}
        />
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
    padding: 16,
    paddingBottom: 40,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.brandText,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: theme.brandBurgundy,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.brandTextSecondary,
  },
  modeTabTextActive: {
    color: theme.white,
  },
  networkStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  networkStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  wifiIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18, 183, 106, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodIndicator: {
    backgroundColor: 'rgba(128, 13, 21, 0.12)',
  },
  networkStatusTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  networkStatusIp: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.brandBurgundy,
  },
  networkStatusSub: {
    fontSize: 11,
    color: theme.brandTextSecondary,
    marginTop: 1,
  },
  networkStatusActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 13, 21, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipEditCard: {
    backgroundColor: theme.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  ipEditLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.brandBurgundy,
    marginBottom: 6,
  },
  ipInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ipInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: theme.brandText,
    backgroundColor: theme.brandSurfaceLight,
  },
  ipSaveBtn: {
    backgroundColor: theme.brandBurgundy,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipSaveBtnText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '700',
  },
  qrCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  brandContainer: {
    marginBottom: 10,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.brandBurgundy,
    textAlign: 'center',
    marginBottom: 8,
  },
  envBadgeRow: {
    marginBottom: 16,
  },
  envBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  envBadgeProd: {
    backgroundColor: theme.brandText,
    borderWidth: 1,
    borderColor: theme.brandGold,
  },
  envBadgeDev: {
    backgroundColor: 'rgba(128, 13, 21, 0.08)',
    borderWidth: 1,
    borderColor: theme.brandBurgundy,
  },
  envBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  envBadgeTextProd: {
    color: theme.brandGold,
  },
  envBadgeTextDev: {
    color: theme.brandBurgundy,
  },
  scanToJoinHeaderBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: theme.brandSurfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.brandBorder,
    marginBottom: 16,
  },
  scanToJoinHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.brandBurgundy,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  scanToJoinUrlText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.brandText,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: theme.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 16,
  },
  scanInstruction: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  pinSection: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandTextSecondary,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  pinBox: {
    backgroundColor: theme.brandText,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.brandGold,
  },
  pinText: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.brandGold,
    letterSpacing: 6,
  },
  urlBox: {
    width: '100%',
    backgroundColor: theme.brandSurfaceLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  urlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.brandTextSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  urlText: {
    fontSize: 12,
    color: theme.brandBurgundy,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    width: '100%',
  },
  returnBtn: {
    width: '100%',
  },
});
