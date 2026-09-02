export interface ParsedQRResult {
  isValid: boolean;
  type?: string;
  quizId?: string;
  pin?: string;
  format?: 'FORMAT_1_JSON' | 'FORMAT_2_DEEPLINK' | 'FORMAT_3_RAW_PIN';
  error?: string;
}

/**
 * Validates and extracts quizId and PIN from QR payload formats:
 * FORMAT 1 (Official JSON): {"type":"QUIZ_JOIN","quizId":"quiz-college-2026","pin":"123456"}
 * FORMAT 2 (Legacy Deep Link): quizapp://quiz/123456
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

  // FORMAT 2: Full URL (HTTPS, LAN IP http://10.10.8.81:8081/join/..., DeepLink)
  const pinParamMatch = trimmed.match(/[?&]pin=(\d{6})/i) || trimmed.match(/\/(\d{6})\b/);
  const joinPathMatch = trimmed.match(/\/join\/([^/?#]+)/i);
  if (pinParamMatch || joinPathMatch) {
    return {
      isValid: true,
      type: 'QUIZ_JOIN',
      quizId: joinPathMatch ? decodeURIComponent(joinPathMatch[1]) : undefined,
      pin: pinParamMatch ? pinParamMatch[1] : undefined,
      format: 'FORMAT_2_DEEPLINK',
    };
  }

  // FORMAT 3: Deep Link format (e.g. quizapp://quiz/123456)
  if (trimmed.toLowerCase().includes('quizapp://') || trimmed.toLowerCase().includes('syncquiz://')) {
    const pinMatch = trimmed.match(/\/(\d{6})\b/) || trimmed.match(/pin=(\d{6})/i);
    if (pinMatch && pinMatch[1]) {
      return {
        isValid: true,
        type: 'QUIZ_JOIN',
        pin: pinMatch[1],
        format: 'FORMAT_2_DEEPLINK',
      };
    }
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

import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const DEFAULT_PRODUCTION_DOMAIN = 'https://syncquiz.app';
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

    // If client is already accessing from a remote IP (e.g. on student phone), use that hostname
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0' && hostname !== '::1') {
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
 * Builds a universal HTTPS or LAN join URL for a quiz:
 * Example: http://10.174.246.113:8081/join/quiz-college-2026?pin=123456
 */
export const buildQuizJoinURL = (quizId: string, pin: string, baseUrl?: string, customIp?: string): string => {
  let targetBase = baseUrl;
  if (!targetBase) {
    targetBase = getDetectedLanHost(customIp).baseUrl;
  }
  const cleanBase = targetBase.replace(/\/+$/, '');
  return `${cleanBase}/join/${encodeURIComponent(quizId)}?pin=${encodeURIComponent(pin)}`;
};

/**
 * Extracts quizId and pin from an incoming HTTPS Universal Link or Deep Link URL
 * Supported formats:
 * - https://syncquiz.app/join/quiz-college-2026?pin=123456
 * - http://192.168.1.100:8081/join/quiz-college-2026?pin=123456
 * - syncquiz://join/quiz-college-2026?pin=123456
 * - quizapp://join/quiz-college-2026?pin=123456
 */
export const parseQuizURL = (url: string): { quizId?: string; pin?: string; isValid: boolean } => {
  if (!url || typeof url !== 'string') return { isValid: false };

  const trimmed = url.trim();

  // Extract quizId from path /join/<quizId>
  const joinPathMatch = trimmed.match(/\/join\/([^/?#]+)/i);
  const quizId = joinPathMatch ? decodeURIComponent(joinPathMatch[1]) : undefined;

  // Extract pin parameter ?pin=123456 or path fallback
  const pinParamMatch = trimmed.match(/[?&]pin=(\d{6})/i) || trimmed.match(/\/(\d{6})\b/);
  const pin = pinParamMatch ? pinParamMatch[1] : undefined;

  if (quizId || pin) {
    return {
      isValid: true,
      quizId,
      pin,
    };
  }

  // Fallback to parseQuizQRPayload
  const qrRes = parseQuizQRPayload(trimmed);
  return {
    isValid: qrRes.isValid,
    quizId: qrRes.quizId,
    pin: qrRes.pin,
  };
};

/**
 * Backwards compatible helper returning only the PIN if valid
 */
export const extractPinFromQR = (data: string): string | null => {
  const parsedUrl = parseQuizURL(data);
  if (parsedUrl.isValid && parsedUrl.pin) {
    return parsedUrl.pin;
  }
  const res = parseQuizQRPayload(data);
  return res.isValid && res.pin ? res.pin : null;
};


