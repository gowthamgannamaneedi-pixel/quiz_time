import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface ParsedQRResult {
  isValid: boolean;
  type?: string;
  quizId?: string;
  pin?: string;
  format?: 'FORMAT_1_JSON' | 'FORMAT_2_DEEPLINK' | 'FORMAT_3_RAW_PIN';
  error?: string;
}

/**
 * Stable, canonical public production URL.
 * Never requests Vercel authentication or login.
 */
export const PRODUCTION_DOMAIN = 'https://quiz-time-chi.vercel.app';
export const DEFAULT_LAN_PORT = '8081';

// Dynamic cache of the computer's active LAN IP reported by the backend server
let dynamicServerLanIp: string | null = null;

export const setDynamicServerLanIp = (ip: string | null) => {
  if (ip && typeof ip === 'string' && ip.trim() && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== '0.0.0.0') {
    dynamicServerLanIp = ip.trim();
  }
};

export const getDynamicServerLanIp = (): string | null => {
  return dynamicServerLanIp;
};

/**
 * Checks if the current execution context is in production (e.g. deployed on Vercel)
 */
export const isProductionEnvironment = (): boolean => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;
    if (protocol === 'https:') return true;
    if (hostname.includes('vercel.app')) return true;
    if (
      hostname &&
      hostname !== 'localhost' &&
      hostname !== '127.0.0.1' &&
      hostname !== '0.0.0.0' &&
      !hostname.endsWith('.local') &&
      !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)
    ) {
      return true;
    }
  }
  return process.env.NODE_ENV === 'production';
};

/**
 * Dynamically detects the current computer LAN IP address and Web port.
 * When on web localhost, uses dynamicServerLanIp reported by the server so other devices can connect.
 */
export const getDetectedLanHost = (customLanIp?: string): { ip: string; port: string; baseUrl: string } => {
  let detectedPort = DEFAULT_LAN_PORT;
  let detectedIp = '127.0.0.1';

  if (customLanIp && customLanIp.trim()) {
    detectedIp = customLanIp.trim();
  } else if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const port = window.location.port || DEFAULT_LAN_PORT;
    detectedPort = port;

    // If client is already accessing from a remote LAN IP, use that hostname
    if (hostname && /^\d+\.\d+\.\d+\.\d+$/.test(hostname) && hostname !== '127.0.0.1' && hostname !== '0.0.0.0') {
      detectedIp = hostname;
    } else if (dynamicServerLanIp) {
      // If admin is browsing on localhost, use the server's real dynamically detected LAN IPv4
      detectedIp = dynamicServerLanIp;
    } else {
      detectedIp = hostname || '127.0.0.1';
    }
  } else if (Constants.expoConfig?.hostUri) {
    const parts = Constants.expoConfig.hostUri.split(':');
    if (parts[0] && parts[0] !== 'localhost' && parts[0] !== '127.0.0.1') {
      detectedIp = parts[0];
    } else if (dynamicServerLanIp) {
      detectedIp = dynamicServerLanIp;
    }
    if (parts[1]) {
      detectedPort = parts[1];
    }
  } else if (dynamicServerLanIp) {
    detectedIp = dynamicServerLanIp;
  }

  const baseUrl = `http://${detectedIp}:${detectedPort}`;

  return {
    ip: detectedIp,
    port: detectedPort,
    baseUrl,
  };
};

/**
 * Gets the production origin strictly pinned to the public canonical domain
 */
export const getProductionOrigin = (): string => {
  return PRODUCTION_DOMAIN;
};

/**
 * Gets the local LAN origin for local WiFi testing
 */
export const getLocalLanOrigin = (customLanIp?: string): string => {
  return getDetectedLanHost(customLanIp).baseUrl;
};

/**
 * Gets the base origin for QR and link generation:
 * - 'PRODUCTION': strictly returns https://quiz-time-chi.vercel.app (NEVER preview URLs)
 * - 'LOCAL_LAN': returns the computer's reachable LAN IP (http://10.x.x.x:8081)
 */
export const getBaseOrigin = (mode: 'PRODUCTION' | 'LOCAL_LAN' = 'PRODUCTION', customLanIp?: string): string => {
  if (mode === 'PRODUCTION') {
    return PRODUCTION_DOMAIN;
  }
  return getLocalLanOrigin(customLanIp);
};

/**
 * Builds a universal HTTPS or LAN join URL for a quiz:
 * In PRODUCTION: https://quiz-time-chi.vercel.app/join/quiz-college-2026?pin=123456
 * In LOCAL_LAN:  http://10.174.246.113:8081/join/quiz-college-2026?pin=123456
 */
export const buildQuizJoinURL = (
  quizId: string,
  pin: string,
  mode: 'PRODUCTION' | 'LOCAL_LAN' = 'PRODUCTION',
  customIp?: string
): string => {
  const base = mode === 'PRODUCTION' ? PRODUCTION_DOMAIN : getLocalLanOrigin(customIp);
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/join/${encodeURIComponent(quizId)}?pin=${encodeURIComponent(pin)}`;
};

/**
 * Validates and extracts quizId and PIN from QR payload formats:
 * FORMAT 1 (Official JSON): {"type":"QUIZ_JOIN","quizId":"quiz-college-2026","pin":"123456"}
 * FORMAT 2 (Universal HTTPS URL & Deep Link): https://quiz-time-chi.vercel.app/join/quiz-college-2026?pin=123456
 * FORMAT 3 (Raw PIN String): 123456
 */
export const parseQuizQRPayload = (rawText: string): ParsedQRResult => {
  if (!rawText || typeof rawText !== 'string') {
    return { isValid: false, error: 'Empty QR code data.' };
  }

  const trimmed = rawText.trim();

  // FORMAT 1: Exact JSON payload
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        if (parsed.type !== 'QUIZ_JOIN') {
          return { isValid: false, error: 'Unrecognized QR type. Expected QUIZ_JOIN.' };
        }
        if (!parsed.quizId || typeof parsed.quizId !== 'string' || !parsed.quizId.trim()) {
          return { isValid: false, error: 'QR payload missing quizId.' };
        }
        const pinStr = String(parsed.pin || '').trim();
        if (!pinStr || !/^\d{6}$/.test(pinStr)) {
          return { isValid: false, error: 'QR payload missing valid 6-digit PIN.' };
        }
        return {
          isValid: true,
          type: parsed.type,
          quizId: parsed.quizId.trim(),
          pin: pinStr,
          format: 'FORMAT_1_JSON',
        };
      }
    } catch {
      // Continue to next checks if JSON parse fails
    }
  }

  // FORMAT 2: Full URL (HTTPS Vercel URL, LAN IP URL, DeepLink)
  // e.g. https://quiz-time-chi.vercel.app/join/quiz-college-2026?pin=123456
  const pinParamMatch = trimmed.match(/[?&]pin=(\d{6})/i) || trimmed.match(/\/join\/[^/]+\/(\d{6})\b/i);
  const joinPathMatch = trimmed.match(/\/join\/([^/?#]+)/i);
  if (pinParamMatch || joinPathMatch) {
    const extractedQuizId = joinPathMatch ? decodeURIComponent(joinPathMatch[1]) : undefined;
    const extractedPin = pinParamMatch ? pinParamMatch[1] : undefined;

    return {
      isValid: true,
      type: 'QUIZ_JOIN',
      quizId: extractedQuizId,
      pin: extractedPin,
      format: 'FORMAT_2_DEEPLINK',
    };
  }

  // FORMAT 3: Deep Link format (e.g. syncquiz://join/quiz-college-2026?pin=123456)
  if (trimmed.toLowerCase().includes('quizapp://') || trimmed.toLowerCase().includes('syncquiz://')) {
    const pinMatch = trimmed.match(/pin=(\d{6})/i) || trimmed.match(/\/(\d{6})\b/);
    const quizMatch = trimmed.match(/\/join\/([^/?#]+)/i) || trimmed.match(/\/quiz\/([^/?#]+)/i);
    return {
      isValid: true,
      type: 'QUIZ_JOIN',
      quizId: quizMatch ? decodeURIComponent(quizMatch[1]) : undefined,
      pin: pinMatch ? pinMatch[1] : undefined,
      format: 'FORMAT_2_DEEPLINK',
    };
  }

  // FORMAT 4: Exact 6-digit numeric PIN string (e.g. "123456")
  if (/^\d{6}$/.test(trimmed)) {
    return {
      isValid: true,
      type: 'QUIZ_JOIN',
      pin: trimmed,
      format: 'FORMAT_3_RAW_PIN',
    };
  }

  // Fallback: Check if any standalone 6-digit sequence exists in rawText
  const fallbackMatch = trimmed.match(/\b\d{6}\b/);
  if (fallbackMatch) {
    return {
      isValid: true,
      type: 'QUIZ_JOIN',
      pin: fallbackMatch[0],
      format: 'FORMAT_3_RAW_PIN',
    };
  }

  return { isValid: false, error: 'Invalid Quiz QR code format.' };
};

/**
 * Extracts quizId and pin from an incoming HTTPS Universal Link or Deep Link URL
 */
export const parseQuizURL = (url: string): { quizId?: string; pin?: string; isValid: boolean } => {
  if (!url || typeof url !== 'string') return { isValid: false };

  const res = parseQuizQRPayload(url);
  return {
    isValid: res.isValid,
    quizId: res.quizId,
    pin: res.pin,
  };
};

/**
 * Backwards compatible helper returning only the PIN if valid
 */
export const extractPinFromQR = (data: string): string | null => {
  const parsed = parseQuizQRPayload(data);
  return parsed.isValid && parsed.pin ? parsed.pin : null;
};
