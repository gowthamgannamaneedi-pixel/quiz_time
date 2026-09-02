import { Platform } from 'react-native';

const STORAGE_KEY_STUDENT_NAME = 'syncquiz_student_name';
const STORAGE_KEY_PARTICIPANT_ID = 'syncquiz_participant_id';

let memoryStudentName = '';
let memoryParticipantId = '';

export const getStoredStudentName = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(STORAGE_KEY_STUDENT_NAME) || memoryStudentName;
    } catch {
      return memoryStudentName;
    }
  }
  return memoryStudentName;
};

export const setStoredStudentName = (name: string): void => {
  const clean = (name || '').trim();
  memoryStudentName = clean;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_STUDENT_NAME, clean);
    } catch {}
  }
};

export const createFreshParticipantId = (): string => {
  const newPid = `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  memoryParticipantId = newPid;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY_PARTICIPANT_ID, newPid);
    } catch {}
  }
  return newPid;
};

export const getOrCreateParticipantId = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    try {
      let pid = window.localStorage.getItem(STORAGE_KEY_PARTICIPANT_ID);
      if (!pid) {
        pid = `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        window.localStorage.setItem(STORAGE_KEY_PARTICIPANT_ID, pid);
      }
      return pid;
    } catch {}
  }
  if (!memoryParticipantId) {
    memoryParticipantId = `p_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
  return memoryParticipantId;
};

export interface PinValidationResult {
  isValid: boolean;
  normalizedPin: string;
  error?: string;
}

export const validateAndNormalizePin = (
  enteredPin: string,
  officialPin: string
): PinValidationResult => {
  const cleanEntered = String(enteredPin || '').trim().replace(/\s+/g, '');
  const cleanOfficial = String(officialPin || '').trim().replace(/\s+/g, '');

  if (!cleanEntered) {
    return {
      isValid: false,
      normalizedPin: '',
      error: 'Please enter a 6-digit Quiz PIN.',
    };
  }

  if (!/^\d{6}$/.test(cleanEntered)) {
    return {
      isValid: false,
      normalizedPin: cleanEntered,
      error: 'Quiz PIN must be exactly 6 numeric digits.',
    };
  }

  if (cleanEntered === '000000') {
    return {
      isValid: false,
      normalizedPin: cleanEntered,
      error: 'Invalid Quiz PIN code.',
    };
  }

  if (cleanEntered !== cleanOfficial) {
    return {
      isValid: false,
      normalizedPin: cleanEntered,
      error: 'Invalid Quiz PIN. Please check the screen.',
    };
  }

  return {
    isValid: true,
    normalizedPin: cleanEntered,
  };
};

export const validateStudentName = (name: string): { isValid: boolean; cleanName: string; error?: string } => {
  const clean = (name || '').trim();
  if (!clean) {
    return {
      isValid: false,
      cleanName: '',
      error: 'Please enter your Full Name before joining.',
    };
  }
  if (clean.length < 2) {
    return {
      isValid: false,
      cleanName: clean,
      error: 'Name must be at least 2 characters.',
    };
  }
  if (clean.length > 50) {
    return {
      isValid: false,
      cleanName: clean.substring(0, 50),
      error: 'Name cannot exceed 50 characters.',
    };
  }
  return {
    isValid: true,
    cleanName: clean,
  };
};
