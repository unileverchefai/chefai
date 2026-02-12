const TOKEN_KEY = 'ufs-auth-token';

function readTokenCookie() {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
    if (!match) {
      return null;
    }
    return decodeURIComponent(match[1]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Token] Error reading token cookie:', error);
    return null;
  }
}

export function getToken() {
  return readTokenCookie();
}

export function setToken(token) {
  if (!token) {
    return;
  }

  try {
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days
    const encoded = encodeURIComponent(token);
    document.cookie = `${TOKEN_KEY}=${encoded}; path=/; max-age=${maxAgeSeconds}; secure; samesite=lax`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Token] Error setting token cookie:', error);
  }
}

export function removeToken() {
  try {
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; secure; samesite=lax`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Token] Error removing token cookie:', error);
  }
}

export function hasToken() {
  return !!getToken();
}

export function getUserIdFromToken() {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }
    return token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Token] Error getting token:', error);
    return null;
  }
}
