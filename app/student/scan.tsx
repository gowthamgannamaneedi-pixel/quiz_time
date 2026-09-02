import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { parseQuizQRPayload } from '../../src/utils/deepLink';
import { useAdminQuiz } from '../../src/hooks/useAdminQuiz';
import { Button } from '../../src/components/Button';
import { quizStore } from '../../src/store/quizStore';
import { realtimeSession } from '../../src/services/realtimeSession';
import { theme } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.68;

interface DebugScanInfo {
  rawData: string;
  format?: string;
  type?: string;
  quizId?: string;
  pin?: string;
  matchSuccess: boolean;
  joinSuccess: boolean;
  error?: string;
}

export default function StudentScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const { quiz } = useAdminQuiz();

  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugScanInfo | null>(null);

  // Synchronous lock ref to prevent duplicate barcode processing
  const isProcessingScanRef = useRef(false);

  const handleQRCode = (rawData: string) => {
    // PREVENT MULTIPLE SCANS
    if (isProcessingScanRef.current || scanned) return;
    isProcessingScanRef.current = true;
    setScanned(true);
    setScanError(null);

    try {
      // 1. Parse QR payload
      const parseResult = parseQuizQRPayload(rawData);

      if (!parseResult.isValid || !parseResult.pin) {
        const errorMsg = parseResult.error || 'Invalid Quiz QR code.';
        setDebugInfo({
          rawData,
          matchSuccess: false,
          joinSuccess: false,
          error: errorMsg,
        });
        setScanError(errorMsg);
        return;
      }

      // 2. Validate extracted PIN & Quiz ID against active quiz in store & realtime session
      const activeQuiz = quizStore.getQuiz();
      const sessionPin = realtimeSession.getSession().pin;
      const expectedPin = sessionPin || activeQuiz.pin;
      const isPinMatch = parseResult.pin === expectedPin || parseResult.pin === activeQuiz.pin;
      const isQuizIdMatch = !parseResult.quizId || parseResult.quizId === activeQuiz.id;

      if (!isPinMatch) {
        const errorMsg = `Invalid Quiz QR: PIN "${parseResult.pin}" does not match active event PIN (${expectedPin}).`;
        setDebugInfo({
          rawData,
          format: parseResult.format,
          type: parseResult.type,
          quizId: parseResult.quizId,
          pin: parseResult.pin,
          matchSuccess: false,
          joinSuccess: false,
          error: errorMsg,
        });
        setScanError(errorMsg);
        return;
      }

      if (!isQuizIdMatch) {
        const errorMsg = `Invalid Quiz QR: Quiz ID "${parseResult.quizId}" does not match active quiz (${activeQuiz.id}).`;
        setDebugInfo({
          rawData,
          format: parseResult.format,
          type: parseResult.type,
          quizId: parseResult.quizId,
          pin: parseResult.pin,
          matchSuccess: false,
          joinSuccess: false,
          error: errorMsg,
        });
        setScanError(errorMsg);
        return;
      }

      // 3. Record debug information
      setDebugInfo({
        rawData,
        format: parseResult.format,
        type: parseResult.type || 'QUIZ_JOIN',
        quizId: parseResult.quizId || activeQuiz.id,
        pin: parseResult.pin,
        matchSuccess: true,
        joinSuccess: true,
      });

      // 4. Navigate to Universal Join Screen with PIN prefilled
      const targetQuizId = parseResult.quizId || activeQuiz.id;
      setTimeout(() => {
        router.replace({
          pathname: '/join/[quizId]',
          params: { quizId: targetQuizId, pin: parseResult.pin },
        });
      }, 400);
    } catch (err: any) {
      console.error('Error handling QR scan:', err);
      const errorMsg = 'Invalid Quiz QR. Failed to process data.';
      setDebugInfo({
        rawData,
        matchSuccess: false,
        joinSuccess: false,
        error: errorMsg,
      });
      setScanError(errorMsg);
    }
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    handleQRCode(data);
  };

  const handleResetScan = () => {
    setScanError(null);
    setScanned(false);
    setDebugInfo(null);
    isProcessingScanRef.current = false;
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="camera-outline" size={38} color={theme.brandBurgundy} />
          </View>
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorSubtitle}>
            Camera permission is required to scan the quiz QR.
          </Text>
          <Text style={styles.instructionsText}>
            Please tap "Allow Camera Access" below or enter the 6-digit PIN manually.
          </Text>
          <Button
            title="ALLOW CAMERA ACCESS"
            onPress={requestPermission}
            style={{ marginBottom: 12, width: '100%' }}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.manualBackBtn}>
            <Text style={styles.backLinkText}>Return to Manual PIN Entry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          {/* Header Controls */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.circleButton}
            >
              <Ionicons name="close" size={22} color={theme.white} />
            </TouchableOpacity>

            <Text style={styles.scannerHeaderTitle}>Scan Official Quiz QR</Text>

            <TouchableOpacity
              onPress={() => setTorchEnabled(!torchEnabled)}
              style={[styles.circleButton, torchEnabled && styles.torchActive]}
            >
              <Ionicons
                name={torchEnabled ? 'flash' : 'flash-off'}
                size={20}
                color={torchEnabled ? theme.brandGold : theme.white}
              />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Frame */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.scanBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              {!scanError && <View style={styles.laserLine} />}
            </View>

            {!scanError ? (
              <Text style={styles.guideText}>
                Align the event QR code inside the frame
              </Text>
            ) : null}

            {/* LIVE DEBUG OVERLAY */}
            {debugInfo && (
              <View style={styles.debugOverlayCard}>
                <View style={styles.debugTitleRow}>
                  <Ionicons name="bug-outline" size={14} color={theme.brandBurgundy} />
                  <Text style={styles.debugOverlayTitle}>QR DETECTED</Text>
                </View>
                <Text style={styles.debugRowText} numberOfLines={1}>
                  <Text style={styles.debugLabel}>RAW DATA: </Text>{debugInfo.rawData}
                </Text>
                {debugInfo.format && (
                  <Text style={styles.debugRowText}>
                    <Text style={styles.debugLabel}>Format: </Text>{debugInfo.format}
                  </Text>
                )}
                {debugInfo.type && (
                  <Text style={styles.debugRowText}>
                    <Text style={styles.debugLabel}>Type: </Text>{debugInfo.type}
                  </Text>
                )}
                {debugInfo.quizId && (
                  <Text style={styles.debugRowText}>
                    <Text style={styles.debugLabel}>Quiz ID: </Text>{debugInfo.quizId}
                  </Text>
                )}
                {debugInfo.pin && (
                  <Text style={styles.debugRowText}>
                    <Text style={styles.debugLabel}>PIN: </Text>{debugInfo.pin}
                  </Text>
                )}
                <View style={styles.debugStatusRow}>
                  <Text style={debugInfo.matchSuccess ? styles.debugSuccess : styles.debugFail}>
                    {debugInfo.matchSuccess ? 'MATCH: ✓ Quiz found' : 'MATCH: ✗ Mismatch'}
                  </Text>
                  <Text style={debugInfo.joinSuccess ? styles.debugSuccess : styles.debugFail}>
                    {debugInfo.joinSuccess ? 'JOIN: ✓ Success' : 'JOIN: ✗ Failed'}
                  </Text>
                </View>
              </View>
            )}

            {/* Error Notification with SCAN AGAIN button */}
            {scanError && (
              <View style={styles.scanErrorBox}>
                <View style={styles.errorTitleRow}>
                  <Ionicons name="alert-circle" size={18} color={theme.danger} />
                  <Text style={styles.errorTitleText}>Invalid Quiz QR</Text>
                </View>
                <Text style={styles.scanErrorText}>{scanError}</Text>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleResetScan}
                  style={styles.scanAgainBtn}
                >
                  <Ionicons name="refresh" size={16} color={theme.white} />
                  <Text style={styles.scanAgainText}>SCAN AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Bottom Option */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={styles.manualEntryPill}
            >
              <Ionicons name="keypad-outline" size={16} color={theme.white} />
              <Text style={styles.manualEntryText}>Or enter 6-digit PIN manually</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.brandBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scannerHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.white,
    letterSpacing: 0.5,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  torchActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderColor: theme.brandGold,
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBox: {
    width: SCAN_BOX_SIZE,
    height: SCAN_BOX_SIZE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: theme.brandAccent,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: theme.brandAccent,
  },
  guideText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanErrorBox: {
    backgroundColor: theme.dangerSurface,
    borderWidth: 1.5,
    borderColor: theme.dangerBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
    maxWidth: 320,
    alignItems: 'center',
  },
  errorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.dangerText,
  },
  scanErrorText: {
    color: theme.dangerText,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.brandBurgundy,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  scanAgainText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.white,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  manualEntryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  manualEntryText: {
    color: theme.white,
    fontSize: 13,
    fontWeight: '600',
  },
  messageBox: {
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: theme.white,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.brandBorder,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.brandBurgundyLight,
    borderWidth: 1.5,
    borderColor: theme.brandBurgundyBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  messageText: {
    color: theme.brandTextSecondary,
    fontSize: 15,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.brandText,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: theme.brandTextSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  manualBackBtn: {
    paddingVertical: 8,
  },
  backLinkText: {
    color: theme.brandBurgundy,
    fontSize: 13,
    fontWeight: '700',
  },
  debugOverlayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: theme.brandBorder,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    width: SCAN_BOX_SIZE,
  },
  debugTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  debugOverlayTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.brandBurgundy,
    letterSpacing: 0.5,
  },
  debugRowText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.brandText,
    marginBottom: 2,
  },
  debugLabel: {
    color: theme.brandTextSecondary,
    fontWeight: '700',
  },
  debugStatusRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: theme.brandBorder,
    gap: 2,
  },
  debugSuccess: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.success,
    fontFamily: 'monospace',
  },
  debugFail: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.danger,
    fontFamily: 'monospace',
  },
});
