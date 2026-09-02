const ADMIN_AUTH_KEY = '@syncquiz_admin_auth_session';
const REQUIRED_ADMIN_PASSWORD = '211007';

let inMemoryAuth = false;

export const isAdminAuthenticated = (): boolean => {
  if (inMemoryAuth) return true;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const val = window.sessionStorage.getItem(ADMIN_AUTH_KEY);
      if (val === 'true') {
        inMemoryAuth = true;
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
};

export const verifyAdminPassword = (inputPassword: string): boolean => {
  const cleanInput = String(inputPassword || '').trim();
  if (cleanInput === REQUIRED_ADMIN_PASSWORD) {
    inMemoryAuth = true;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      } catch {
        // ignore
      }
    }
    return true;
  }
  return false;
};

export const logoutAdmin = (): void => {
  inMemoryAuth = false;
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // ignore
    }
  }
};
