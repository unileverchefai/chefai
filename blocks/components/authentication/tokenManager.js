const TOKEN_KEY = 'ufs-auth-token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasToken() {
  return !!getToken();
}

export function getUserIdFromToken() {
  try {
    const token = getToken();
    if (!token) {
      // eslint-disable-next-line no-console
      console.log('[Token] No token found in sessionStorage');
      return null;
    }

    // The user_id is the entire token value itself
    // eslint-disable-next-line no-console
    console.log('[Token] Using entire token as user_id');
    return token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Token] Error getting token:', error);
    return null;
  }
}
